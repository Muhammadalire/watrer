import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Gets the start of the current day in UTC.
 * This is crucial for matching the 'date' field consistently.
 */
function getTodayAtMidnight(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC
  return today;
}

// GET today's hydration record
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

    const today = getTodayAtMidnight();

    // Find or create today's record
    // This ensures a user always has a record for the current day
    const hydrationRecord = await db.hydrationRecord.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {}, // Just find it if it exists
      create: {
        userId: user.id,
        date: today,
        glasses: 0,
        target: 8, // Default target
      },
    });

    return NextResponse.json(hydrationRecord);
  } catch (error) {
    console.error('Error getting hydration data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST (add) a glass of water
export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Or create user if they don't exist
      // For now, we'll assume they must exist
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = getTodayAtMidnight();

    // Find today's record and increment 'glasses'
    // If it doesn't exist, create it with 'glasses' set to 1
    const updatedRecord = await db.hydrationRecord.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        glasses: {
          increment: 1,
        },
      },
      create: {
        userId: user.id,
        date: today,
        glasses: 1, // Start with 1 glass
        target: 8,
      },
    });

    // Check if target is met
    if (updatedRecord.glasses >= updatedRecord.target && !updatedRecord.completed) {
      const finalRecord = await db.hydrationRecord.update({
        where: { id: updatedRecord.id },
        data: { completed: true },
      });
      return NextResponse.json(finalRecord);
    }

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Error adding glass:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}