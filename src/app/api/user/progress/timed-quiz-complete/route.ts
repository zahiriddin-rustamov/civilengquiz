import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { User, UserProgress } from '@/models/database';

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

    // Check if user already completed a timed quiz today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Use a special contentId for timed quiz tracking
    const timedQuizContentId = 'timed-quiz-daily';

    // Find existing timed quiz progress for today
    const existingProgress = await UserProgress.findOne({
      userId,
      contentId: timedQuizContentId,
      contentType: 'quiz',
      lastAccessed: {
        $gte: today,
        $lt: tomorrow
      }
    });

    let xpAwarded = false;
    let xpGained = 0;
    let leveledUp = false;
    let newLevel = null;
    let newAchievements = [];

    // If no progress today, award XP (higher for timed quiz due to difficulty)
    if (!existingProgress) {
      // Award more XP for timed quiz - base 8 XP + bonus based on performance
      const baseXP = 8;
      const performanceBonus = score >= 80 ? 3 : score >= 60 ? 2 : score >= 40 ? 1 : 0;
      xpGained = baseXP + performanceBonus;
      xpAwarded = true;

      // Get current user data
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const oldLevel = user.level;
      const newTotalXP = user.totalXP + xpGained;

      // Calculate new level (every 100 XP = 1 level)
      const calculatedLevel = Math.floor(newTotalXP / 100) + 1;
      leveledUp = calculatedLevel > oldLevel;
      newLevel = calculatedLevel;

      // Update user XP and level
      await User.findByIdAndUpdate(userId, {
        totalXP: newTotalXP,
        level: calculatedLevel,
        lastActiveDate: new Date()
      });

      // Create or update progress record
      await UserProgress.findOneAndUpdate(
        {
          userId,
          contentId: timedQuizContentId,
          contentType: 'quiz'
        },
        {
          userId,
          contentId: timedQuizContentId,
          contentType: 'quiz',
          completed: true,
          score,
          timeSpent,
          lastAccessed: new Date(),
          attempts: 1,
          data: {
            correctAnswers,
            totalQuestions,
            completionDate: new Date(),
            xpAwarded: xpGained,
            mode: 'timed',
            performanceBonus
          },
          totalXPEarned: xpGained,
          firstCompletedDate: new Date(),
          lastDailyXPDate: new Date(),
          dailyXPCount: 1
        },
        {
          upsert: true,
          new: true
        }
      );
    } else {
      // Update existing progress without awarding XP
      await UserProgress.findByIdAndUpdate(existingProgress._id, {
        score: Math.max(existingProgress.score || 0, score), // Keep best score
        timeSpent: existingProgress.timeSpent + timeSpent,
        lastAccessed: new Date(),
        attempts: (existingProgress.attempts || 0) + 1,
        $push: {
          'data.attempts': {
            score,
            correctAnswers,
            totalQuestions,
            timeSpent,
            timestamp: new Date()
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      xpAwarded,
      xpGained,
      leveledUp,
      newLevel,
      newAchievements,
      message: xpAwarded
        ? `Excellent! You earned ${xpGained} XP for completing the timed quiz!${
            xpGained > 8 ? ` (${xpGained - 8} performance bonus!)` : ''
          }`
        : 'Quiz completed! You already earned XP for timed quiz today.'
    });

  } catch (error) {
    console.error('Error processing timed quiz completion:', error);
    return NextResponse.json(
      { error: 'Failed to process quiz completion' },
      { status: 500 }
    );
  }
}