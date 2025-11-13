import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendHydrationNotification, shouldSendNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, notificationEmail, userName } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          id: userId,
          email,
          name: userName || null,
          notificationEmail: notificationEmail || email
        }
      });
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's hydration record
    let hydrationRecord = await db.hydrationRecord.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today
        }
      }
    });

    if (!hydrationRecord) {
      hydrationRecord = await db.hydrationRecord.create({
        data: {
          userId: user.id,
          date: today,
          glasses: 0,
          target: 8,
          completed: false
        }
      });
    }

    // Add one glass
    const updatedRecord = await db.hydrationRecord.update({
      where: { id: hydrationRecord.id },
      data: {
        glasses: hydrationRecord.glasses + 1,
        completed: hydrationRecord.glasses + 1 >= hydrationRecord.target
      }
    });

    // Calculate streak
    const streak = await calculateStreak(user.id);

    // Check if we should send notification
    const shouldSend = await shouldSendNotification(user.id, updatedRecord.glasses);
    
    if (shouldSend) {
      // Send email notification
      await sendHydrationNotification({
        userId: user.id,
        email: user.notificationEmail || email,
        userName: user.name || undefined,
        glassesCount: updatedRecord.glasses,
        streakCount: streak,
        targetGlasses: updatedRecord.target
      });
    }

    // Check and unlock achievements
    await checkAchievements(user.id, updatedRecord.glasses, streak);

    // Get user stats
    const stats = await getUserStats(user.id);

    return NextResponse.json({
      success: true,
      hydration: {
        glasses: updatedRecord.glasses,
        target: updatedRecord.target,
        completed: updatedRecord.completed,
        streak
      },
      stats,
      notificationSent: shouldSend
    });

  } catch (error) {
    console.error('Error adding glass:', error);
    return NextResponse.json(
      { error: 'Failed to add glass' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    // Find user
    let user;
    if (email) {
      user = await db.user.findUnique({ where: { email } });
    } else {
      user = await db.user.findUnique({ where: { id: userId! } });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get today's hydration record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hydrationRecord = await db.hydrationRecord.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today
        }
      }
    });

    // Calculate streak
    const streak = await calculateStreak(user.id);

    // Get user stats
    const stats = await getUserStats(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        notificationEmail: user.notificationEmail
      },
      hydration: hydrationRecord ? {
        glasses: hydrationRecord.glasses,
        target: hydrationRecord.target,
        completed: hydrationRecord.completed
      } : {
        glasses: 0,
        target: 8,
        completed: false
      },
      streak,
      stats
    });

  } catch (error) {
    console.error('Error getting hydration data:', error);
    return NextResponse.json(
      { error: 'Failed to get hydration data' },
      { status: 500 }
    );
  }
}

async function calculateStreak(userId: string): Promise<number> {
  const records = await db.hydrationRecord.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < records.length; i++) {
    const recordDate = new Date(records[i].date);
    recordDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (recordDate.getTime() === expectedDate.getTime() && records[i].completed) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

async function getUserStats(userId: string) {
  const totalRecords = await db.hydrationRecord.findMany({
    where: { userId }
  });

  const totalGlasses = totalRecords.reduce((sum, record) => sum + record.glasses, 0);
  const completedDays = totalRecords.filter(record => record.completed).length;
  
  // Get last 7 days for weekly average
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyRecords = totalRecords.filter(record => 
    new Date(record.date) >= sevenDaysAgo
  );
  
  const weeklyAverage = weeklyRecords.length > 0 
    ? weeklyRecords.reduce((sum, record) => sum + record.glasses, 0) / weeklyRecords.length
    : 0;

  return {
    totalGlasses,
    completedDays,
    weeklyAverage: Math.round(weeklyAverage * 10) / 10
  };
}

async function checkAchievements(userId: string, glassesCount: number, streakCount: number) {
  // Define achievements
  const achievements = [
    { name: "First Sip", description: "Started your hydration journey", icon: "💧", requirement: 1, type: "total" },
    { name: "Hydration Hero", description: "8 glasses in one day", icon: "🦸", requirement: 8, type: "daily" },
    { name: "3-Day Streak", description: "3 days of perfect hydration", icon: "🔥", requirement: 3, type: "streak" },
    { name: "Week Warrior", description: "7 days of perfect hydration", icon: "🏆", requirement: 7, type: "streak" },
    { name: "Monthly Master", description: "30 days of perfect hydration", icon: "👑", requirement: 30, type: "streak" },
    { name: "100 Glasses Club", description: "100 total glasses consumed", icon: "💎", requirement: 100, type: "total" }
  ];

  for (const achievement of achievements) {
    const existingAchievement = await db.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.name
        }
      }
    });

    if (!existingAchievement) {
      // Create achievement in database if it doesn't exist
      const dbAchievement = await db.achievement.upsert({
        where: { id: achievement.name },
        update: {},
        create: {
          id: achievement.name,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          requirement: achievement.requirement,
          type: achievement.type
        }
      });

      let shouldUnlock = false;
      
      if (achievement.type === 'daily' && glassesCount >= achievement.requirement) {
        shouldUnlock = true;
      } else if (achievement.type === 'streak' && streakCount >= achievement.requirement) {
        shouldUnlock = true;
      } else if (achievement.type === 'total') {
        const totalGlasses = await db.hydrationRecord.aggregate({
          where: { userId },
          _sum: { glasses: true }
        });
        
        if ((totalGlasses._sum.glasses || 0) >= achievement.requirement) {
          shouldUnlock = true;
        }
      }

      if (shouldUnlock) {
        await db.userAchievement.create({
          data: {
            userId,
            achievementId: dbAchievement.id,
            unlocked: true,
            unlockedAt: new Date()
          }
        });
      }
    }
  }
}