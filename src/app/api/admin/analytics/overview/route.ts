import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Subject, Topic, QuestionSection, Question, Flashcard, Media, UserInteraction, SessionTracking, UserProgress, User } from '@/models/database';

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

    // Get subject-content mapping
    const subjectContentMap = await buildSubjectContentMap();

    // Process data per subject
    const subjectAnalytics = await Promise.all(subjects.map(async (subject) => {
      // Get all content IDs for this subject
      const subjectContentIds = subjectContentMap.get(subject._id.toString()) || new Set();

      // Filter interactions for this subject's content
      const subjectInteractions = interactions.filter(i => {
        // Match by direct subject metadata or through content ID mapping
        return i.metadata?.subjectId?.toString() === subject._id.toString() ||
               (i.contentId && subjectContentIds.has(i.contentId.toString()));
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

      // Calculate accuracy metrics from UserProgress (more reliable)
      const subjectProgressRecords = await UserProgress.find({
        subjectId: subject._id,
        contentType: 'question'
      }).lean();

      // Calculate average first-attempt score
      const firstTryAttempts = subjectProgressRecords.filter(p =>
        p.attempts >= 1 && p.firstAttemptScore !== undefined
      );

      const firstAttemptAccuracy = firstTryAttempts.length > 0
        ? Math.round(firstTryAttempts.reduce((sum, p) => sum + p.firstAttemptScore, 0) / firstTryAttempts.length)
        : 0;

      // Calculate completion rate from UserProgress
      const totalContent = await countSubjectContent(subject._id);
      const completedContentRecords = await UserProgress.find({
        subjectId: subject._id,
        completed: true
      }).lean();

      const uniqueCompletedContent = new Set(
        completedContentRecords.map(p => `${p.contentId}-${p.contentType}`)
      );

      const completionRate = totalContent > 0 ? (uniqueCompletedContent.size / totalContent) * 100 : 0;

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
    const insights = await generateInsights(subjectAnalytics, interactions);

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

// Build a map of subject ID to all content IDs within that subject
async function buildSubjectContentMap(): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();

  // Get all topics with their subject relationships
  const topics = await Topic.find({}).lean();

  for (const topic of topics) {
    const subjectId = topic.subjectId.toString();
    if (!map.has(subjectId)) {
      map.set(subjectId, new Set());
    }
    const contentIds = map.get(subjectId)!;

    // Add topic content
    contentIds.add(topic._id.toString());

    // Get questions from all sections in this topic
    const sections = await QuestionSection.find({ topicId: topic._id }).lean();
    for (const section of sections) {
      contentIds.add(section._id.toString());

      const questions = await Question.find({ sectionId: section._id }).lean();
      questions.forEach(q => contentIds.add(q._id.toString()));
    }

    // Get flashcards for this topic
    const flashcards = await Flashcard.find({ topicId: topic._id }).lean();
    flashcards.forEach(f => contentIds.add(f._id.toString()));

    // Get media for this topic
    const media = await Media.find({ topicId: topic._id }).lean();
    media.forEach(m => contentIds.add(m._id.toString()));
  }

  return map;
}

async function countSubjectContent(subjectId: any): Promise<number> {
  const topics = await Topic.find({ subjectId }).lean();
  let totalContent = 0;

  for (const topic of topics) {
    // Count sections and questions
    const sections = await QuestionSection.find({ topicId: topic._id }).lean();
    totalContent += sections.length;

    for (const section of sections) {
      const questionCount = await Question.countDocuments({ sectionId: section._id });
      totalContent += questionCount;
    }

    // Count flashcards
    const flashcardCount = await Flashcard.countDocuments({ topicId: topic._id });
    totalContent += flashcardCount;

    // Count media
    const mediaCount = await Media.countDocuments({ topicId: topic._id });
    totalContent += mediaCount;
  }

  return totalContent;
}

async function generateInsights(subjectAnalytics: any[], interactions: any[]): Promise<string[]> {
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

  // Insight 4: Learning patterns - data-driven performance comparison
  const learningPatternInsight = await analyzeLearningPatternPerformance();
  if (learningPatternInsight) {
    insights.push(learningPatternInsight);
  }

  return insights;
}

async function analyzeLearningPatternPerformance(): Promise<string | null> {
  try {
    // Get all user progress records for questions to analyze learning patterns
    const questionProgress = await UserProgress.find({
      contentType: 'question',
      attempts: { $gte: 1 },
      firstAttemptScore: { $exists: true }
    }).lean();

    if (questionProgress.length === 0) return null;

    // Group by user to analyze their learning sequences
    const userPatterns = new Map<string, any[]>();

    // Get all user progress records (all content types) to determine sequences
    const allProgress = await UserProgress.find({
      userId: { $in: questionProgress.map(p => p.userId) }
    }).sort({ updatedAt: 1 }).lean();

    // Group all progress by user
    allProgress.forEach(progress => {
      const userId = progress.userId.toString();
      if (!userPatterns.has(userId)) {
        userPatterns.set(userId, []);
      }
      userPatterns.get(userId)!.push(progress);
    });

    // Categorize users by their learning patterns
    const flashcardFirstUsers: string[] = [];
    const directQuestionUsers: string[] = [];

    userPatterns.forEach((userProgress, userId) => {
      // Look for users who did flashcards before questions in the same topic
      const hasFlashcardBeforeQuestion = userProgress.some((progress, index) => {
        if (progress.contentType === 'flashcard') {
          // Check if there's a question in the same topic after this flashcard
          const laterQuestion = userProgress.slice(index + 1).find(p =>
            p.contentType === 'question' &&
            p.topicId?.toString() === progress.topicId?.toString()
          );
          return !!laterQuestion;
        }
        return false;
      });

      // Check if user went directly to questions (first interaction per topic was question)
      const topicFirstInteractions = new Map<string, any>();
      userProgress.forEach(progress => {
        const topicId = progress.topicId?.toString();
        if (topicId && !topicFirstInteractions.has(topicId)) {
          topicFirstInteractions.set(topicId, progress);
        }
      });

      const hasDirectQuestionStart = Array.from(topicFirstInteractions.values())
        .some(first => first.contentType === 'question');

      if (hasFlashcardBeforeQuestion) {
        flashcardFirstUsers.push(userId);
      } else if (hasDirectQuestionStart) {
        directQuestionUsers.push(userId);
      }
    });

    // Calculate performance for each group
    if (flashcardFirstUsers.length < 3 || directQuestionUsers.length < 3) {
      return null; // Need sufficient sample size
    }

    const flashcardFirstPerformance = questionProgress
      .filter(p => flashcardFirstUsers.includes(p.userId.toString()))
      .reduce((sum, p) => sum + p.firstAttemptScore, 0) /
      questionProgress.filter(p => flashcardFirstUsers.includes(p.userId.toString())).length;

    const directQuestionPerformance = questionProgress
      .filter(p => directQuestionUsers.includes(p.userId.toString()))
      .reduce((sum, p) => sum + p.firstAttemptScore, 0) /
      questionProgress.filter(p => directQuestionUsers.includes(p.userId.toString())).length;

    const performanceDiff = Math.round(flashcardFirstPerformance - directQuestionPerformance);

    // Only generate insight if there's a meaningful difference (>5%)
    if (Math.abs(performanceDiff) >= 5) {
      if (performanceDiff > 0) {
        return `Students who study flashcards before questions score ${performanceDiff}% higher (${Math.round(flashcardFirstPerformance)}% vs ${Math.round(directQuestionPerformance)}%)`;
      } else {
        return `Students who go directly to questions score ${Math.abs(performanceDiff)}% higher (${Math.round(directQuestionPerformance)}% vs ${Math.round(flashcardFirstPerformance)}%)`;
      }
    }

    return null; // No significant difference found
  } catch (error) {
    console.error('Error analyzing learning patterns:', error);
    return null;
  }
}