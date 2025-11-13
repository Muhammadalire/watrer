import { NextRequest, NextResponse } from 'next/server';
import { sendHydrationNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, testType } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Test email notification
    const result = await sendHydrationNotification({
      userId: 'test_user',
      email: email,
      userName: 'Beautiful',
      glassesCount: testType === 'milestone' ? 4 : 2,
      streakCount: testType === 'milestone' ? 3 : 1,
      targetGlasses: 8
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        result: result.result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: (result.error as any)?.message || 'Failed to send test email'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint. Send a POST request with email to test.',
    setup: {
      step1: 'Get a Resend API key from https://resend.com',
      step2: 'Add RESEND_API_KEY to your .env file',
      step3: 'Set NOTIFICATION_EMAIL to your desired email',
      step4: 'Test using POST request with email body'
    }
  });
}