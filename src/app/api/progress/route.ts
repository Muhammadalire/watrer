import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface WeeklyData {
  date: string;
  dayName: string;
  glasses: number;
  target: number;
  completed: boolean;
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

    // Get last 7 days of hydration data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyRecords = await db.hydrationRecord.findMany({
      where: {
        userId: user.id,
        date: {
          gte: sevenDaysAgo
        }
      },
      orderBy: { date: 'asc' }
    });

    // Fill missing days with 0 glasses
    const weeklyData: WeeklyData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const record = weeklyRecords.find(r => 
        new Date(r.date).getTime() === date.getTime()
      );
      
      weeklyData.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        glasses: record?.glasses || 0,
        target: 8,
        completed: record?.completed || false
      });
    }

    // Calculate streak
    const streak = await calculateStreak(user.id);

    // Get best streak
    const bestStreak = await calculateBestStreak(user.id);

    // Get total stats
    const stats = await getUserStats(user.id);

    // Get achievements
    const achievements = await getUserAchievements(user.id);

    return NextResponse.json({
      success: true,
      weeklyData,
      streak,
      bestStreak,
      stats,
      achievements
    });

  } catch (error) {
    console.error('Error getting progress data:', error);
    return NextResponse.json(
      { error: 'Failed to get progress data' },
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

async function calculateBestStreak(userId: string): Promise<number> {
  const records = await db.hydrationRecord.findMany({
    where: { userId },
    orderBy: { date: 'asc' }
  });

  let bestStreak = 0;
  let currentStreak = 0;

  for (const record of records) {
    if (record.completed) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return bestStreak;
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

async function getUserAchievements(userId: string) {
  const userAchievements = await db.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true
    },
    orderBy: { unlockedAt: 'desc' }
  });

  return userAchievements.map(ua => ({
    id: ua.achievement.id,
    name: ua.achievement.name,
    description: ua.achievement.description,
    icon: ua.achievement.icon,
    requirement: ua.achievement.requirement,
    type: ua.achievement.type,
    unlocked: ua.unlocked,
    unlockedAt: ua.unlockedAt
  }));
}