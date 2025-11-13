import { Resend } from 'resend';
import { db } from '@/lib/db';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailNotificationData {
  userId: string;
  email: string;
  userName?: string;
  glassesCount: number;
  streakCount: number;
  targetGlasses: number;
}

export async function sendHydrationNotification(data: EmailNotificationData) {
  try {
    const { email, userName, glassesCount, streakCount, targetGlasses } = data;
    
    const subject = `💕 Hydration Milestone: ${glassesCount} Glasses Down!`;
    
    const emailContent = generateEmailContent({
      userName: userName || 'Beautiful',
      glassesCount,
      streakCount,
      targetGlasses,
      remaining: targetGlasses - glassesCount
    });

    const result = await resend.emails.send({
      from: 'Hydration Love <noreply@hydrationlove.com>',
      to: email,
      subject,
      html: emailContent
    });

    // Log the email
    await db.emailLog.create({
      data: {
        userId: data.userId,
        email,
        subject,
        content: emailContent,
        sent: true,
        sentAt: new Date()
      }
    });

    return { success: true, result };
  } catch (error) {
    console.error('Failed to send email:', error);
    
    // Log the error
    await db.emailLog.create({
      data: {
        userId: data.userId,
        email: data.email,
        subject: 'Hydration Notification',
        content: 'Failed to send',
        sent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return { success: false, error };
  }
}

function generateEmailContent(data: {
  userName: string;
  glassesCount: number;
  streakCount: number;
  targetGlasses: number;
  remaining: number;
}) {
  const { userName, glassesCount, streakCount, targetGlasses, remaining } = data;
  
  const isHalfway = glassesCount >= targetGlasses / 2;
  const isAlmostDone = glassesCount >= targetGlasses - 1;
  const isComplete = glassesCount >= targetGlasses;
  
  let message = '';
  let motivation = '';
  
  if (isComplete) {
    message = `🎉 Amazing! You've completed your daily hydration goal!`;
    motivation = `You're absolutely incredible! ${streakCount} days of dedication shows how much you care about yourself.`;
  } else if (isAlmostDone) {
    message = `💪 So close! Just ${remaining} more glass(es) to go!`;
    motivation = `You're doing fantastic! The finish line is in sight and you're glowing with dedication!`;
  } else if (isHalfway) {
    message = `🌟 Halfway there! You're on fire!`;
    motivation = `You're absolutely crushing it! Every sip is a love letter to yourself.`;
  } else {
    message = `💧 Great progress! Keep it up!`;
    motivation = `You're building such a wonderful habit! Your body is thanking you with every glass.`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hydration Love Notification</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #F8E8E8 0%, #E6E0F0 50%, #FDF9F5 100%);
          margin: 0;
          padding: 20px;
          color: #2D2D2D;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(254, 254, 254, 0.9);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 10px 30px rgba(232, 180, 184, 0.2);
          border: 2px solid #E8B4B8;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .title {
          font-family: 'Georgia', serif;
          font-size: 2rem;
          color: #E8B4B8;
          margin-bottom: 10px;
        }
        .message {
          font-size: 1.3rem;
          color: #5A5A5A;
          text-align: center;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .progress-bar {
          width: 100%;
          height: 20px;
          background: rgba(232, 180, 184, 0.2);
          border-radius: 10px;
          overflow: hidden;
          margin: 20px 0;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #E8B4B8, #E6E0F0);
          border-radius: 10px;
          transition: width 0.3s ease;
        }
        .stats {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
        }
        .stat {
          text-align: center;
        }
        .stat-value {
          font-family: 'Georgia', serif;
          font-size: 1.8rem;
          color: #E8B4B8;
          font-weight: 600;
        }
        .stat-label {
          font-size: 0.9rem;
          color: #5A5A5A;
          margin-top: 5px;
        }
        .motivation {
          background: rgba(230, 224, 240, 0.3);
          padding: 25px;
          border-radius: 15px;
          margin: 20px 0;
          border-left: 4px solid #E8B4B8;
        }
        .motivation-text {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #5A5A5A;
          font-style: italic;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid rgba(232, 180, 184, 0.3);
          color: #A8A8A8;
          font-size: 0.9rem;
        }
        .hearts {
          font-size: 1.2rem;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">💕 Hydration Love</div>
          <div class="hearts">💖 ✨ 💝</div>
        </div>
        
        <div class="message">
          ${message}
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(glassesCount / targetGlasses) * 100}%"></div>
        </div>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${glassesCount}</div>
            <div class="stat-label">Glasses Today</div>
          </div>
          <div class="stat">
            <div class="stat-value">${streakCount}</div>
            <div class="stat-label">Day Streak 🔥</div>
          </div>
          <div class="stat">
            <div class="stat-value">${remaining}</div>
            <div class="stat-label">Glasses Left</div>
          </div>
        </div>
        
        <div class="motivation">
          <div class="motivation-text">
            ${motivation}
          </div>
        </div>
        
        <div class="footer">
          <p>With all my love, forever 💕</p>
          <p>Your Hydration Companion</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function shouldSendNotification(userId: string, currentGlasses: number): Promise<boolean> {
  // Check if we should send notification (every 2 glasses)
  if (currentGlasses % 2 !== 0) {
    return false;
  }

  // Check if we already sent notification for this milestone
  const lastEmailLog = await db.emailLog.findFirst({
    where: {
      userId,
      subject: {
        contains: `${currentGlasses} Glasses`
      },
      sent: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // If we haven't sent an email for this milestone yet, send one
  return !lastEmailLog;
}