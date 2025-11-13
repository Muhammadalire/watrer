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

    // Find all unlocked rewards for this user
    const rewards = await db.reward.findMany({
      where: {
        userId: user.id,
        unlocked: true,
      },
      orderBy: {
        createdAt: 'asc', // Show them in the order they were earned
      },
    });

    return NextResponse.json(rewards);
  } catch (error) {
    console.error('Error getting rewards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}