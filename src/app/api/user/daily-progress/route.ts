import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { UserProgress, User } from '@/models/database';

// GET /api/user/daily-progress - Get user's daily progress and goals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    await connectToDatabase();

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count today's completed activities
    const todayCompleted = await UserProgress.countDocuments({
      userId,
      lastAccessed: {
        $gte: today,
        $lt: tomorrow
      },
      completed: true
    });

    // Count today's quiz sessions (questions answered)
    const todayQuizzes = await UserProgress.countDocuments({
      userId,
      contentType: { $in: ['question', 'section'] },
      lastAccessed: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Count today's flashcards studied
    const todayFlashcards = await UserProgress.countDocuments({
      userId,
      contentType: 'flashcard',
      lastAccessed: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Count today's media watched
    const todayMedia = await UserProgress.countDocuments({
      userId,
      contentType: 'media',
      lastAccessed: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Get user's average daily activity for dynamic goal setting
    const user = await User.findById(userId).lean();
    const accountAge = user ? Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))) : 1;

    // Calculate average daily activity
    const totalActivities = await UserProgress.countDocuments({ userId, completed: true });
    const avgDailyActivity = Math.max(1, Math.floor(totalActivities / accountAge));

    // Set dynamic daily goals based on user's typical activity
    // Start with conservative goals and increase based on history
    let dailyGoal = 3; // Default goal
    let goalType = 'activities';

    if (avgDailyActivity > 10) {
      dailyGoal = Math.min(15, avgDailyActivity + 2);
      goalType = 'activities';
    } else if (avgDailyActivity > 5) {
      dailyGoal = Math.min(10, avgDailyActivity + 1);
      goalType = 'quiz sessions';
    } else {
      dailyGoal = Math.max(3, avgDailyActivity + 1);
      goalType = 'quiz sessions';
    }

    // Check user's current streak for motivation
    const currentStreak = user?.currentStreak || 0;

    // Adjust goal based on streak (encourage consistency)
    if (currentStreak > 7) {
      dailyGoal = Math.max(5, dailyGoal);
    } else if (currentStreak > 3) {
      dailyGoal = Math.max(4, dailyGoal);
    }

    // Determine which metric to track for today's goal
    let completed = todayQuizzes;
    let target = dailyGoal;
    let type = goalType;

    // If user is more active with flashcards or media, adjust accordingly
    if (todayFlashcards > todayQuizzes && todayFlashcards > todayMedia) {
      completed = todayFlashcards;
      type = 'flashcards';
      target = Math.max(10, dailyGoal * 3); // Flashcards are quicker
    } else if (todayMedia > todayQuizzes && todayMedia > todayFlashcards) {
      completed = todayMedia;
      type = 'videos';
      target = Math.max(2, Math.floor(dailyGoal / 2)); // Videos take longer
    }

    // Calculate weekly progress
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyCompleted = await UserProgress.countDocuments({
      userId,
      lastAccessed: { $gte: weekAgo },
      completed: true
    });

    const weeklyStats = {
      total: weeklyCompleted,
      daily: Math.round(weeklyCompleted / 7),
      streak: currentStreak
    };

    return NextResponse.json({
      target,
      completed,
      type,
      todayStats: {
        quizzes: todayQuizzes,
        flashcards: todayFlashcards,
        media: todayMedia,
        total: todayCompleted
      },
      weeklyStats,
      streak: currentStreak,
      motivationMessage: getMotivationMessage(completed, target, currentStreak)
    });
  } catch (error) {
    console.error('Error fetching daily progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily progress' },
      { status: 500 }
    );
  }
}

function getMotivationMessage(completed: number, target: number, streak: number): string {
  const progress = (completed / target) * 100;

  if (progress >= 100) {
    if (streak > 7) {
      return `🔥 Amazing! ${streak} day streak and still going strong!`;
    }
    return '🎉 Daily goal achieved! Keep up the great work!';
  } else if (progress >= 75) {
    return '💪 Almost there! Just a little more to reach your daily goal!';
  } else if (progress >= 50) {
    return '📈 Halfway through your daily goal. You\'ve got this!';
  } else if (progress > 0) {
    return '🚀 Great start! Keep the momentum going!';
  } else {
    if (streak > 0) {
      return `🔥 Don't break your ${streak} day streak! Start learning now!`;
    }
    return '🎯 Ready to start your learning journey today?';
  }
}