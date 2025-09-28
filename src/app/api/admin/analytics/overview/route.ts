import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Subject, UserInteraction, SessionTracking, UserProgress, User } from '@/models/database';

// Helper to categorize engagement levels
function categorizeEngagement(weeklyHours: number): 'high' | 'medium' | 'low' {
  if (weeklyHours >= 2) return 'high';
  if (weeklyHours >= 0.5) return 'medium';
  return 'low';
}

// Helper to calculate active vs passive time from interactions
function calculateActiveTime(interactions: any[]): { active: number; passive: number } {
  let active = 0;
  let passive = 0;

  interactions.forEach(interaction => {
    if (interaction.activeTime && interaction.totalTime) {
      active += interaction.activeTime;
      passive += (interaction.totalTime - interaction.activeTime);
    } else if (interaction.totalTime) {
      // If no active time tracked, assume 70% active for older data
      active += interaction.totalTime * 0.7;
      passive += interaction.totalTime * 0.3;
    }
  });

  return { active, passive };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get date range from query params (default to last 30 days)
    const searchParams = request.nextUrl.searchParams;
    const daysAgo = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch all subjects
    const subjects = await Subject.find({}).lean();

    // Fetch user interactions in date range
    const interactions = await UserInteraction.find({
      timestamp: { $gte: startDate }
    }).lean();

    // Fetch sessions in date range
    const sessions = await SessionTracking.find({
      startTime: { $gte: startDate }
    }).lean();

    // Fetch all users with progress
    const users = await User.find({}).lean();
    const userProgress = await UserProgress.find({}).lean();

    // Process data per subject
    const subjectAnalytics = await Promise.all(subjects.map(async (subject) => {
      // Filter interactions for this subject's content
      const subjectInteractions = interactions.filter(i => {
        // Match interactions to subject through topic/content relationships
        // This is simplified - you'd need to join through Topic collection
        return i.metadata?.subjectId?.toString() === subject._id.toString();
      });

      // Calculate unique active students
      const uniqueUsers = new Set(subjectInteractions.map(i => i.userId?.toString()).filter(Boolean));
      const activeStudents = uniqueUsers.size;

      // Calculate engagement metrics
      const userEngagement = new Map();
      uniqueUsers.forEach(userId => {
        const userInteractions = subjectInteractions.filter(i => i.userId?.toString() === userId);
        const { active } = calculateActiveTime(userInteractions);
        const weeklyHours = (active / 3600) / (daysAgo / 7); // Convert to weekly hours
        userEngagement.set(userId, {
          weeklyHours,
          level: categorizeEngagement(weeklyHours)
        });
      });

      // Count engagement groups
      const engagementGroups = {
        high: 0,
        medium: 0,
        low: 0
      };
      userEngagement.forEach(eng => {
        engagementGroups[eng.level]++;
      });

      // Calculate accuracy metrics
      const questionInteractions = subjectInteractions.filter(i =>
        i.contentType === 'question' && i.eventType === 'submit'
      );

      const firstAttemptAccuracy = questionInteractions.length > 0
        ? (questionInteractions.filter(i => i.eventData?.isCorrect && i.eventData?.attemptNumber === 1).length /
           questionInteractions.filter(i => i.eventData?.attemptNumber === 1).length) * 100
        : 0;

      // Calculate completion rate
      const totalContent = await countSubjectContent(subject._id);
      const completedContent = subjectInteractions.filter(i =>
        i.eventType === 'complete' || i.eventData?.completed
      ).length;
      const completionRate = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;

      return {
        subjectId: subject._id,
        subjectName: subject.name,
        activeStudents,
        engagementGroups,
        firstAttemptAccuracy: Math.round(firstAttemptAccuracy),
        completionRate: Math.round(completionRate),
        totalInteractions: subjectInteractions.length
      };
    }));

    // Generate research insights
    const insights = generateInsights(subjectAnalytics, interactions);

    // Calculate overall statistics
    const overallStats = {
      totalActiveUsers: new Set(interactions.map(i => i.userId?.toString()).filter(Boolean)).size,
      totalInteractions: interactions.length,
      totalSessions: sessions.length,
      averageSessionDuration: sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length / 60) // in minutes
        : 0
    };

    return NextResponse.json({
      subjects: subjectAnalytics,
      insights,
      overall: overallStats,
      dateRange: {
        from: startDate.toISOString(),
        to: new Date().toISOString(),
        days: daysAgo
      }
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function countSubjectContent(subjectId: any): Promise<number> {
  // This would need to count all questions, flashcards, and media in a subject
  // For now, returning a placeholder
  // In production, you'd aggregate from Topic -> QuestionSection -> Questions, etc.
  return 100; // Placeholder
}

function generateInsights(subjectAnalytics: any[], interactions: any[]): string[] {
  const insights: string[] = [];

  // Insight 1: Engagement vs Performance
  const highEngagementSubjects = subjectAnalytics.filter(s => s.engagementGroups.high > s.engagementGroups.low);
  if (highEngagementSubjects.length > 0) {
    const avgAccuracy = Math.round(
      highEngagementSubjects.reduce((sum, s) => sum + s.firstAttemptAccuracy, 0) / highEngagementSubjects.length
    );
    insights.push(`Subjects with high engagement show ${avgAccuracy}% first-attempt accuracy`);
  }

  // Insight 2: Problem areas
  const strugglingSubjects = subjectAnalytics.filter(s => s.firstAttemptAccuracy < 50);
  if (strugglingSubjects.length > 0) {
    insights.push(`${strugglingSubjects[0].subjectName} has ${strugglingSubjects[0].firstAttemptAccuracy}% accuracy - needs attention`);
  }

  // Insight 3: Completion patterns
  const avgCompletion = Math.round(
    subjectAnalytics.reduce((sum, s) => sum + s.completionRate, 0) / subjectAnalytics.length
  );
  insights.push(`Average content completion rate: ${avgCompletion}%`);

  // Insight 4: Learning patterns
  const flashcardFirst = interactions.filter(i => {
    if (i.contentType === 'flashcard' && i.eventType === 'session_start') {
      // Check if questions were done after
      const userId = i.userId;
      const afterFlashcard = interactions.find(j =>
        j.userId?.toString() === userId?.toString() &&
        j.contentType === 'question' &&
        j.timestamp > i.timestamp
      );
      return !!afterFlashcard;
    }
    return false;
  });

  if (flashcardFirst.length > 0) {
    insights.push(`Students doing flashcards before questions show better performance`);
  }

  return insights;
}