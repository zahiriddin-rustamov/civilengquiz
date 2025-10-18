import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { User, UserProgress } from '@/models/database';
import { XPService } from '@/lib/xp-service';

// POST /api/user/progress/timed-quiz-complete - Award XP for completing timed quiz
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { score, correctAnswers, totalQuestions, timeSpent, mode } = await request.json();
    const userId = session.user.id;
    await connectToDatabase();

    // Generate unique ID for this quiz completion
    const quizId = `timed-quiz-${Date.now()}-${userId}`;

    // Check for duplicate submission (last 2 minutes)
    const recentTime = new Date(Date.now() - 2 * 60 * 1000);
    const isDuplicate = await UserProgress.findOne({
      userId,
      contentType: 'quiz',
      'data.quizType': 'timed',
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

    // Check if user already got XP for timed quiz today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayXPRecord = await UserProgress.findOne({
      userId,
      contentType: 'quiz',
      'data.quizType': 'timed',
      'data.xpAwarded': { $exists: true, $gt: 0 },
      lastAccessed: { $gte: today, $lt: tomorrow }
    });

    let xpAwarded = false;
    let xpGained = 0;
    let leveledUp = false;
    let newLevel = null;
    let newAchievements = [];

    // Calculate XP with performance bonus
    const baseXP = 10;
    let performanceBonus = 0;

    if (score >= 100) {
      performanceBonus = 5; // 100% gets +5 (15 XP total)
    } else if (score >= 90) {
      performanceBonus = 4; // 90-99% gets +4 (14 XP)
    } else if (score >= 80) {
      performanceBonus = 3; // 80-89% gets +3 (13 XP)
    } else if (score >= 70) {
      performanceBonus = 2; // 70-79% gets +2 (12 XP)
    } else if (score >= 60) {
      performanceBonus = 1; // 60-69% gets +1 (11 XP)
    }
    // Below 60% gets no bonus (10 XP base)

    const calculatedXP = baseXP + performanceBonus;

    // Award XP only if user hasn't received XP today
    if (!todayXPRecord) {
      xpGained = calculatedXP;
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
        quizType: 'timed',
        correctAnswers,
        totalQuestions,
        completionDate: new Date(),
        xpAwarded: xpGained,
        performanceBonus
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
        ? `Excellent! You earned ${totalXPEarned} XP for completing a timed quiz!${
            performanceBonus > 0 ? ` (${performanceBonus} performance bonus!)` : ''
          }${achievementXP > 0 ? ` (+${achievementXP} from achievements!)` : ''}`
        : 'Quiz completed! You already earned XP for a timed quiz today, but this attempt counts toward achievements.'
    });

  } catch (error) {
    console.error('Error processing timed quiz completion:', error);
    return NextResponse.json(
      { error: 'Failed to process quiz completion' },
      { status: 500 }
    );
  }
}