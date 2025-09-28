import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import {
  Subject,
  Topic,
  QuestionSection,
  UserInteraction,
  UserProgress,
  Flashcard,
  Media
} from '@/models/database';

interface TopicMetrics {
  topicId: string;
  topicName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  avgTime: number; // minutes
  firstTryAccuracy: number;
  retryRate: number;
  completionRate: number;
  contentCounts: {
    questions: number;
    flashcards: number;
    videos: number;
  };
}

interface LearningPattern {
  pattern: string;
  count: number;
  avgAccuracy: number;
  description: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const subjectId = params.id;

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const daysAgo = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch subject details
    const subject = await Subject.findById(subjectId).lean();
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Fetch all topics for this subject
    const topics = await Topic.find({ subjectId }).lean();

    // Fetch topic-related content counts
    const topicMetrics = await Promise.all(
      topics.map(async (topic) => {
        // Get question sections and questions
        const sections = await QuestionSection.find({ topicId: topic._id }).lean();
        const questionCount = sections.reduce((sum, section) => sum + (section.questions?.length || 0), 0);

        // Get flashcards count
        const flashcardCount = await Flashcard.countDocuments({ topicId: topic._id });

        // Get media count
        const mediaCount = await Media.countDocuments({ topicId: topic._id });

        // Get interactions for this topic
        const topicInteractions = await UserInteraction.find({
          timestamp: { $gte: startDate },
          'metadata.topicId': topic._id.toString()
        }).lean();

        // Calculate metrics
        const questionInteractions = topicInteractions.filter(i => i.contentType === 'question');

        // First-try accuracy
        const firstAttempts = questionInteractions.filter(i =>
          i.eventType === 'submit' && i.eventData?.attemptNumber === 1
        );
        const correctFirstAttempts = firstAttempts.filter(i => i.eventData?.isCorrect);
        const firstTryAccuracy = firstAttempts.length > 0
          ? (correctFirstAttempts.length / firstAttempts.length) * 100
          : 0;

        // Retry rate
        const retryAttempts = questionInteractions.filter(i =>
          i.eventType === 'submit' && i.eventData?.attemptNumber > 1
        );
        const retryRate = questionInteractions.length > 0
          ? (retryAttempts.length / questionInteractions.length) * 100
          : 0;

        // Average time
        const timingInteractions = topicInteractions.filter(i => i.totalTime);
        const avgTime = timingInteractions.length > 0
          ? timingInteractions.reduce((sum, i) => sum + (i.totalTime || 0), 0) / timingInteractions.length / 60
          : 0;

        // Completion rate
        const completions = topicInteractions.filter(i =>
          i.eventType === 'complete' || i.eventData?.completed
        );
        const totalContent = questionCount + flashcardCount + mediaCount;
        const completionRate = totalContent > 0
          ? (completions.length / totalContent) * 100
          : 0;

        // Determine difficulty based on metrics
        let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
        if (firstTryAccuracy > 70 && retryRate < 30) difficulty = 'easy';
        else if (firstTryAccuracy < 50 || retryRate > 60) difficulty = 'hard';

        return {
          topicId: topic._id.toString(),
          topicName: topic.name,
          difficulty,
          avgTime: Math.round(avgTime),
          firstTryAccuracy: Math.round(firstTryAccuracy),
          retryRate: Math.round(retryRate),
          completionRate: Math.round(completionRate),
          contentCounts: {
            questions: questionCount,
            flashcards: flashcardCount,
            videos: mediaCount
          }
        } as TopicMetrics;
      })
    );

    // Analyze learning patterns
    const learningPatterns = await analyzeLearningPatterns(subjectId, startDate);

    // Calculate time distribution
    const timeDistribution = await calculateTimeDistribution(subjectId, startDate);

    return NextResponse.json({
      subject: {
        id: subject._id,
        name: subject.name,
        description: subject.description
      },
      topics: topicMetrics,
      learningPatterns,
      timeDistribution,
      dateRange: {
        from: startDate.toISOString(),
        to: new Date().toISOString(),
        days: daysAgo
      }
    });

  } catch (error) {
    console.error('Subject analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subject analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function analyzeLearningPatterns(
  subjectId: string,
  startDate: Date
): Promise<LearningPattern[]> {
  const patterns: LearningPattern[] = [];

  // Get all interactions for this subject
  const interactions = await UserInteraction.find({
    timestamp: { $gte: startDate },
    'metadata.subjectId': subjectId
  }).sort({ userId: 1, timestamp: 1 }).lean();

  // Group by user to analyze patterns
  const userPatterns = new Map();
  interactions.forEach(interaction => {
    const userId = interaction.userId?.toString();
    if (!userId) return;

    if (!userPatterns.has(userId)) {
      userPatterns.set(userId, []);
    }
    userPatterns.get(userId).push(interaction);
  });

  // Analyze common patterns
  let videoFirst = 0;
  let flashcardFirst = 0;
  let questionOnly = 0;
  let mixed = 0;

  let videoFirstAccuracy = 0;
  let flashcardFirstAccuracy = 0;
  let questionOnlyAccuracy = 0;
  let mixedAccuracy = 0;

  userPatterns.forEach((userInteractions) => {
    const sequence = detectLearningSequence(userInteractions);
    const accuracy = calculateUserAccuracy(userInteractions);

    switch (sequence) {
      case 'video-first':
        videoFirst++;
        videoFirstAccuracy += accuracy;
        break;
      case 'flashcard-first':
        flashcardFirst++;
        flashcardFirstAccuracy += accuracy;
        break;
      case 'question-only':
        questionOnly++;
        questionOnlyAccuracy += accuracy;
        break;
      default:
        mixed++;
        mixedAccuracy += accuracy;
    }
  });

  // Create pattern objects
  if (videoFirst > 0) {
    patterns.push({
      pattern: 'Video → Questions',
      count: videoFirst,
      avgAccuracy: Math.round(videoFirstAccuracy / videoFirst),
      description: 'Watch videos before attempting questions'
    });
  }

  if (flashcardFirst > 0) {
    patterns.push({
      pattern: 'Flashcards → Questions',
      count: flashcardFirst,
      avgAccuracy: Math.round(flashcardFirstAccuracy / flashcardFirst),
      description: 'Study flashcards before questions'
    });
  }

  if (questionOnly > 0) {
    patterns.push({
      pattern: 'Questions Only',
      count: questionOnly,
      avgAccuracy: Math.round(questionOnlyAccuracy / questionOnly),
      description: 'Attempt questions directly'
    });
  }

  if (mixed > 0) {
    patterns.push({
      pattern: 'Mixed Approach',
      count: mixed,
      avgAccuracy: Math.round(mixedAccuracy / mixed),
      description: 'Various content types interleaved'
    });
  }

  // Sort by effectiveness (accuracy)
  patterns.sort((a, b) => b.avgAccuracy - a.avgAccuracy);

  return patterns;
}

function detectLearningSequence(interactions: any[]): string {
  const contentSequence = interactions
    .filter(i => i.contentType)
    .map(i => i.contentType);

  if (contentSequence.length === 0) return 'unknown';

  const firstContent = contentSequence[0];
  const hasQuestions = contentSequence.includes('question');

  if (firstContent === 'media' && hasQuestions) return 'video-first';
  if (firstContent === 'flashcard' && hasQuestions) return 'flashcard-first';
  if (contentSequence.every(c => c === 'question')) return 'question-only';

  return 'mixed';
}

function calculateUserAccuracy(interactions: any[]): number {
  const submissions = interactions.filter(i =>
    i.eventType === 'submit' && i.contentType === 'question'
  );

  if (submissions.length === 0) return 0;

  const correct = submissions.filter(i => i.eventData?.isCorrect);
  return (correct.length / submissions.length) * 100;
}

async function calculateTimeDistribution(
  subjectId: string,
  startDate: Date
): Promise<{ consistent: number; cramming: number; sporadic: number }> {
  // Get sessions for this subject
  const sessions = await UserInteraction.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        'metadata.subjectId': subjectId
      }
    },
    {
      $group: {
        _id: {
          userId: '$userId',
          day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.userId',
        studyDays: { $sum: 1 },
        totalInteractions: { $sum: '$count' }
      }
    }
  ]);

  let consistent = 0;
  let cramming = 0;
  let sporadic = 0;

  sessions.forEach(session => {
    const avgInteractionsPerDay = session.totalInteractions / session.studyDays;

    if (session.studyDays >= 5 && avgInteractionsPerDay < 50) {
      consistent++; // Regular study pattern
    } else if (session.studyDays <= 2 && avgInteractionsPerDay > 100) {
      cramming++; // Few days, high intensity
    } else {
      sporadic++; // Irregular pattern
    }
  });

  return { consistent, cramming, sporadic };
}