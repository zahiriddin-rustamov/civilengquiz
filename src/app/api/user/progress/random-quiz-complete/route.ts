import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { User, UserProgress } from '@/models/database';
import { XPService } from '@/lib/xp-service';

// POST /api/user/progress/random-quiz-complete - Award XP for completing random quiz
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { score, correctAnswers, totalQuestions, timeSpent } = await request.json();
    const userId = session.user.id;
    await connectToDatabase();

    // Generate unique ID for this quiz completion
    const quizId = `random-quiz-${Date.now()}-${userId}`;

    // Check for duplicate submission (last 2 minutes)
    const recentTime = new Date(Date.now() - 2 * 60 * 1000);
    const isDuplicate = await UserProgress.findOne({
      userId,
      contentType: 'quiz',
      'data.quizType': 'random',
      lastAccessed: { $gte: recentTime }
    });

    if (isDuplicate) {
      return NextResponse.json({
        success: true,
        xpAwarded: false,
        xpGained: 0,
        message: 'Duplicate submission detected'
      });
    }

    // Check if user already got XP for random quiz today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayXPRecord = await UserProgress.findOne({
      userId,
      contentType: 'quiz',
      'data.quizType': 'random',
      'data.xpAwarded': { $exists: true, $gt: 0 },
      lastAccessed: { $gte: today, $lt: tomorrow }
    });

    let xpAwarded = false;
    let xpGained = 0;
    let leveledUp = false;
    let newLevel = null;
    let newAchievements = [];

    // Award XP only if user hasn't received XP today
    if (!todayXPRecord) {
      xpGained = 10; // 10 XP for first random quiz of the day
      xpAwarded = true;

      // Use XPService to update user XP (handles streaks, achievements, level-ups)
      const xpResult = await XPService.updateUserXP(userId, xpGained);
      leveledUp = xpResult.leveledUp;
      newLevel = xpResult.newLevel;
      newAchievements = xpResult.newAchievements;
    }

    // Always create a progress record for achievements tracking (even if no XP awarded)
    await UserProgress.create({
      userId,
      contentId: quizId,
      contentType: 'quiz',
      completed: true,
      score,
      timeSpent,
      lastAccessed: new Date(),
      attempts: 1,
      data: {
        quizType: 'random',
        correctAnswers,
        totalQuestions,
        completionDate: new Date(),
        xpAwarded: xpGained
      },
      totalXPEarned: xpGained,
      firstCompletedDate: new Date()
    });

    // Calculate achievement XP for message
    const achievementXP = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
    const totalXPEarned = xpGained + achievementXP;

    return NextResponse.json({
      success: true,
      xpAwarded,
      xpGained: totalXPEarned,
      leveledUp,
      newLevel,
      newAchievements,
      message: xpAwarded
        ? `Congratulations! You earned ${totalXPEarned} XP for completing a random quiz!${
            achievementXP > 0 ? ` (+${achievementXP} from achievements!)` : ''
          }`
        : 'Quiz completed! You already earned XP for a random quiz today, but this attempt counts toward achievements.'
    });

  } catch (error) {
    console.error('Error processing random quiz completion:', error);
    return NextResponse.json(
      { error: 'Failed to process quiz completion' },
      { status: 500 }
    );
  }
}