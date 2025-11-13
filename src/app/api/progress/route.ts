import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all unlocked achievements for this user and include
    // the achievement details (name, description, icon)
    const achievements = await db.userAchievement.findMany({
      where: {
        userId: user.id,
        unlocked: true,
      },
      include: {
        achievement: true, // Join the Achievement model
      },
    });

    // We only want to return the achievement details
    const unlockedAchievements = achievements.map(ua => ua.achievement);

    return NextResponse.json(unlockedAchievements);
  } catch (error) {
    console.error('Error getting progress data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}