import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    // Get user's current streak
    const streak = await calculateStreak(user.id);

    // Get total glasses
    const totalGlasses = await db.hydrationRecord.aggregate({
      where: { userId: user.id },
      _sum: { glasses: true }
    });

    // Define available rewards
    const availableRewards = [
      {
        id: '3-day-dedication',
        name: '3-Day Dedication',
        description: 'You\'ve shown amazing consistency! This special video message is just for you.',
        icon: '🎁',
        requirement: 3,
        type: 'streak',
        unlocked: streak >= 3
      },
      {
        id: 'weekly-wonder',
        name: 'Weekly Wonder',
        description: 'Complete a full week of perfect hydration to unlock a romantic dinner surprise!',
        icon: '🌸',
        requirement: 7,
        type: 'streak',
        unlocked: streak >= 7
      },
      {
        id: 'monthly-marvel',
        name: 'Monthly Marvel',
        description: 'Achieve a month of consistent hydration and unlock a special weekend getaway plan!',
        icon: '💎',
        requirement: 30,
        type: 'streak',
        unlocked: streak >= 30
      },
      {
        id: 'hydration-queen',
        name: 'Hydration Queen',
        description: 'Become the ultimate hydration champion and unlock a surprise jewelry gift!',
        icon: '👑',
        requirement: 100,
        type: 'total',
        unlocked: (totalGlasses._sum.glasses || 0) >= 100
      },
      {
        id: 'starlight-achievement',
        name: 'Starlight Achievement',
        description: 'Reach 50 days of perfect hydration for the most special surprise of all!',
        icon: '⭐',
        requirement: 50,
        type: 'streak',
        unlocked: streak >= 50
      },
      {
        id: 'eternal-love',
        name: 'Eternal Love',
        description: 'The ultimate reward for the most dedicated person I know - a promise of forever love!',
        icon: '🏆',
        requirement: 100,
        type: 'streak',
        unlocked: streak >= 100
      }
    ];

    // Get user's claimed rewards from database
    const userRewards = await db.reward.findMany({
      where: { userId: user.id }
    });

    // Merge available rewards with user's reward status
    const rewards = availableRewards.map(reward => {
      const userReward = userRewards.find(ur => ur.id === reward.id);
      return {
        ...reward,
        unlocked: userReward ? userReward.unlocked : reward.unlocked,
        claimed: userReward ? userReward.claimed : false,
        claimedAt: userReward?.claimedAt || null
      };
    });

    return NextResponse.json({
      success: true,
      rewards,
      streak,
      totalGlasses: totalGlasses._sum.glasses || 0
    });

  } catch (error) {
    console.error('Error getting rewards:', error);
    return NextResponse.json(
      { error: 'Failed to get rewards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, rewardId, email } = await request.json();

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
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

    // Get user's current streak
    const streak = await calculateStreak(user.id);

    // Get total glasses
    const totalGlasses = await db.hydrationRecord.aggregate({
      where: { userId: user.id },
      _sum: { glasses: true }
    });

    // Define available rewards
    const availableRewards = [
      {
        id: '3-day-dedication',
        name: '3-Day Dedication',
        description: 'You\'ve shown amazing consistency! This special video message is just for you.',
        type: 'streak',
        requirement: 3
      },
      {
        id: 'weekly-wonder',
        name: 'Weekly Wonder',
        description: 'Complete a full week of perfect hydration to unlock a romantic dinner surprise!',
        type: 'streak',
        requirement: 7
      },
      {
        id: 'monthly-marvel',
        name: 'Monthly Marvel',
        description: 'Achieve a month of consistent hydration and unlock a special weekend getaway plan!',
        type: 'streak',
        requirement: 30
      },
      {
        id: 'hydration-queen',
        name: 'Hydration Queen',
        description: 'Become the ultimate hydration champion and unlock a surprise jewelry gift!',
        type: 'total',
        requirement: 100
      },
      {
        id: 'starlight-achievement',
        name: 'Starlight Achievement',
        description: 'Reach 50 days of perfect hydration for the most special surprise of all!',
        type: 'streak',
        requirement: 50
      },
      {
        id: 'eternal-love',
        name: 'Eternal Love',
        description: 'The ultimate reward for the most dedicated person I know - a promise of forever love!',
        type: 'streak',
        requirement: 100
      }
    ];

    const reward = availableRewards.find(r => r.id === rewardId);
    
    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    // Check if user qualifies for the reward
    let qualifies = false;
    
    if (reward.type === 'streak') {
      qualifies = streak >= reward.requirement;
    } else if (reward.type === 'total') {
      qualifies = (totalGlasses._sum.glasses || 0) >= reward.requirement;
    }

    if (!qualifies) {
      return NextResponse.json(
        { error: 'You do not qualify for this reward yet' },
        { status: 400 }
      );
    }

    // Check if reward already exists
    let userReward = await db.reward.findUnique({
      where: { id: rewardId }
    });

    if (!userReward) {
      // Create the reward
      userReward = await db.reward.create({
        data: {
          id: rewardId,
          userId: user.id,
          name: reward.name,
          description: reward.description,
          type: reward.type,
          requirement: reward.requirement,
          unlocked: true,
          unlockedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      reward: {
        id: userReward.id,
        name: userReward.name,
        description: userReward.description,
        type: userReward.type,
        requirement: userReward.requirement,
        unlocked: userReward.unlocked,
        unlockedAt: userReward.unlockedAt,
        claimed: userReward.claimed,
        claimedAt: userReward.claimedAt
      }
    });

  } catch (error) {
    console.error('Error claiming reward:', error);
    return NextResponse.json(
      { error: 'Failed to claim reward' },
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