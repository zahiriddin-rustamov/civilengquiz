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
  effectiveness: 'high' | 'medium' | 'low';
  avgTimePerContent: number; // in minutes
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

        // First-try accuracy - use firstAttemptScore for accurate calculation
        const questionProgressRecords = await UserProgress.find({
          topicId: topic._id,
          contentType: 'question'
        }).lean();

        // Calculate average first-attempt score
        const firstTryAttempts = questionProgressRecords.filter(p =>
          p.attempts >= 1 && p.firstAttemptScore !== undefined
        );

        const firstTryAccuracy = firstTryAttempts.length > 0
          ? Math.round(firstTryAttempts.reduce((sum, p) => sum + p.firstAttemptScore, 0) / firstTryAttempts.length)
          : 0;

        // Retry rate - calculate from UserProgress attempts
        const retryQuestions = questionProgressRecords.filter(p => p.attempts > 1);
        const retryRate = questionProgressRecords.length > 0
          ? (retryQuestions.length / questionProgressRecords.length) * 100
          : 0;

        // Average time
        const timingInteractions = topicInteractions.filter(i => i.totalTime);
        const avgTime = timingInteractions.length > 0
          ? timingInteractions.reduce((sum, i) => sum + (i.totalTime || 0), 0) / timingInteractions.length / 60
          : 0;

        // Completion rate - calculate based on UserProgress data, not interactions
        const topicProgressRecords = await UserProgress.find({
          topicId: topic._id,
          completed: true
        }).lean();

        // Get unique completed content items
        const uniqueCompletedContent = new Set(
          topicProgressRecords.map(p => `${p.contentId}-${p.contentType}`)
        );

        const totalContent = questionCount + flashcardCount + mediaCount;
        const completionRate = totalContent > 0
          ? (uniqueCompletedContent.size / totalContent) * 100
          : 0;

        // Determine difficulty based on metrics (adjusted for average scores)
        let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
        if (firstTryAccuracy > 75 && retryRate < 30) difficulty = 'easy';
        else if (firstTryAccuracy < 60 || retryRate > 60) difficulty = 'hard';

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

  // Process user patterns sequentially to handle async calculateUserAccuracy
  for (const [userId, userInteractions] of userPatterns.entries()) {
    const sequence = detectLearningSequence(userInteractions);
    const accuracy = await calculateUserAccuracy(userId, subjectId);

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
  }

  // Create pattern objects with effectiveness analysis
  if (videoFirst > 0) {
    const avgTime = calculateAverageTimePerContent(userPatterns, 'video-first');
    patterns.push({
      pattern: 'Video → Questions',
      count: videoFirst,
      avgAccuracy: Math.round(videoFirstAccuracy / videoFirst),
      description: 'Watch videos before attempting questions',
      effectiveness: getEffectivenessRating(videoFirstAccuracy / videoFirst, avgTime),
      avgTimePerContent: Math.round(avgTime)
    });
  }

  if (flashcardFirst > 0) {
    const avgTime = calculateAverageTimePerContent(userPatterns, 'flashcard-first');
    patterns.push({
      pattern: 'Flashcards → Questions',
      count: flashcardFirst,
      avgAccuracy: Math.round(flashcardFirstAccuracy / flashcardFirst),
      description: 'Study flashcards before questions',
      effectiveness: getEffectivenessRating(flashcardFirstAccuracy / flashcardFirst, avgTime),
      avgTimePerContent: Math.round(avgTime)
    });
  }

  if (questionOnly > 0) {
    const avgTime = calculateAverageTimePerContent(userPatterns, 'question-only');
    patterns.push({
      pattern: 'Questions Only',
      count: questionOnly,
      avgAccuracy: Math.round(questionOnlyAccuracy / questionOnly),
      description: 'Attempt questions directly',
      effectiveness: getEffectivenessRating(questionOnlyAccuracy / questionOnly, avgTime),
      avgTimePerContent: Math.round(avgTime)
    });
  }

  if (mixed > 0) {
    const avgTime = calculateAverageTimePerContent(userPatterns, 'mixed');
    patterns.push({
      pattern: 'Mixed Approach',
      count: mixed,
      avgAccuracy: Math.round(mixedAccuracy / mixed),
      description: 'Various content types interleaved',
      effectiveness: getEffectivenessRating(mixedAccuracy / mixed, avgTime),
      avgTimePerContent: Math.round(avgTime)
    });
  }


  // Sort by effectiveness (accuracy) and add cross-content transition analysis
  patterns.sort((a, b) => b.avgAccuracy - a.avgAccuracy);

  // Add transition pattern analysis
  const transitionPatterns = await analyzeContentTransitions(userPatterns, subjectId);
  patterns.push(...transitionPatterns);

  return patterns;
}

// Helper function to calculate effectiveness rating
function getEffectivenessRating(accuracy: number, avgTime: number): 'high' | 'medium' | 'low' {
  // High: >75% accuracy with reasonable time (<10 min per content)
  if (accuracy > 75 && avgTime < 10) return 'high';
  // Medium: >60% accuracy or efficient time usage
  if (accuracy > 60 || avgTime < 8) return 'medium';
  return 'low';
}

// Helper function to calculate average time per content for a learning pattern
function calculateAverageTimePerContent(userPatterns: Map<any, any>, patternType: string): number {
  let totalTime = 0;
  let contentCount = 0;

  userPatterns.forEach((userInteractions) => {
    if (detectLearningSequence(userInteractions) === patternType) {
      const timeSum = userInteractions.reduce((sum: number, interaction: any) => {
        return sum + (interaction.totalTime || 0);
      }, 0);
      const uniqueContent = new Set(userInteractions.map((i: any) => i.contentId?.toString()).filter(Boolean));

      totalTime += timeSum;
      contentCount += uniqueContent.size;
    }
  });

  return contentCount > 0 ? (totalTime / contentCount / 60) : 0; // Convert to minutes
}

// Analyze content transition patterns (cross-content analytics)
async function analyzeContentTransitions(userPatterns: Map<any, any>, subjectId: string): Promise<LearningPattern[]> {
  const transitionPatterns: LearningPattern[] = [];

  // Track common transitions
  const transitions: { [key: string]: { count: number; accuracy: number; time: number } } = {};

  // Process user patterns sequentially to handle async calculateUserAccuracy
  for (const [userId, userInteractions] of userPatterns.entries()) {
    const accuracy = await calculateUserAccuracy(userId, subjectId);
    const totalTime = userInteractions.reduce((sum: number, i: any) => sum + (i.totalTime || 0), 0);

    for (let i = 0; i < userInteractions.length - 1; i++) {
      const current = userInteractions[i];
      const next = userInteractions[i + 1];

      if (current.contentType && next.contentType && current.contentType !== next.contentType) {
        const transitionKey = `${current.contentType} → ${next.contentType}`;

        if (!transitions[transitionKey]) {
          transitions[transitionKey] = { count: 0, accuracy: 0, time: 0 };
        }

        transitions[transitionKey].count++;
        transitions[transitionKey].accuracy += accuracy;
        transitions[transitionKey].time += totalTime;
      }
    }
  }

  // Convert to patterns if significant enough (>= 3 occurrences)
  Object.entries(transitions).forEach(([key, data]) => {
    if (data.count >= 3) {
      const avgAccuracy = data.accuracy / data.count;
      const avgTime = data.time / data.count / 60; // minutes

      transitionPatterns.push({
        pattern: key,
        count: data.count,
        avgAccuracy: Math.round(avgAccuracy),
        description: `Transition pattern: ${key.toLowerCase()}`,
        effectiveness: getEffectivenessRating(avgAccuracy, avgTime),
        avgTimePerContent: Math.round(avgTime)
      });
    }
  });

  return transitionPatterns;
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

async function calculateUserAccuracy(userId: string, subjectId: string): Promise<number> {
  // Get UserProgress records for this user and subject - more reliable than UserInteraction
  const userProgressRecords = await UserProgress.find({
    userId: userId,
    subjectId: subjectId,
    contentType: 'question',
    attempts: { $gte: 1 }, // Only include attempted questions
    firstAttemptScore: { $exists: true } // Ensure we have first attempt data
  }).lean();

  if (userProgressRecords.length === 0) return 0;

  // Calculate average first-attempt accuracy (consistent with main analytics)
  const totalFirstAttemptScore = userProgressRecords.reduce((sum, record) => {
    return sum + (record.firstAttemptScore || 0);
  }, 0);

  return Math.round(totalFirstAttemptScore / userProgressRecords.length);
}

async function calculateTimeDistribution(
  subjectId: string,
  startDate: Date
): Promise<{ consistent: number; cramming: number; sporadic: number; binge: number; perfectionist: number }> {
  // Get detailed session data for this subject
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
        count: { $sum: 1 },
        totalTime: { $sum: '$totalTime' },
        activeTime: { $sum: '$activeTime' },
        firstActivity: { $min: '$timestamp' },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $group: {
        _id: '$_id.userId',
        studyDays: { $sum: 1 },
        totalInteractions: { $sum: '$count' },
        totalStudyTime: { $sum: '$totalTime' },
        totalActiveTime: { $sum: '$activeTime' },
        dailySessions: {
          $push: {
            day: '$_id.day',
            interactions: '$count',
            studyTime: '$totalTime',
            activeTime: '$activeTime',
            sessionLength: {
              $subtract: ['$lastActivity', '$firstActivity']
            }
          }
        }
      }
    }
  ]);

  let consistent = 0;
  let cramming = 0;
  let sporadic = 0;
  let binge = 0;
  let perfectionist = 0;

  sessions.forEach(session => {
    const avgInteractionsPerDay = session.totalInteractions / session.studyDays;
    const avgStudyTimePerDay = (session.totalStudyTime || 0) / session.studyDays; // in seconds
    const engagementRatio = session.totalActiveTime / Math.max(session.totalStudyTime, 1);

    // Sort daily sessions by study time to analyze patterns
    const sortedSessions = session.dailySessions.sort((a: any, b: any) => b.studyTime - a.studyTime);
    const maxDayTime = sortedSessions[0]?.studyTime || 0;
    const avgDayTime = avgStudyTimePerDay;

    // Calculate study distribution (how evenly distributed across days)
    const variance = sortedSessions.reduce((sum: number, day: any) => {
      return sum + Math.pow((day.studyTime || 0) - avgDayTime, 2);
    }, 0) / session.studyDays;
    const studyDistributionScore = Math.sqrt(variance) / Math.max(avgDayTime, 1);

    // Enhanced pattern classification
    if (session.studyDays >= 7 && studyDistributionScore < 0.5 && avgInteractionsPerDay >= 15 && avgInteractionsPerDay <= 60) {
      consistent++; // Regular, distributed study pattern
    } else if (session.studyDays <= 3 && avgInteractionsPerDay > 80 && maxDayTime > avgDayTime * 2) {
      cramming++; // High intensity, short period
    } else if (session.studyDays >= 1 && maxDayTime > avgDayTime * 3 && avgStudyTimePerDay > 7200) { // >2 hours avg
      binge++; // Long study sessions, potentially irregular
    } else if (engagementRatio > 0.85 && avgInteractionsPerDay < 30 && session.studyDays >= 3) {
      perfectionist++; // High engagement, methodical approach
    } else {
      sporadic++; // Irregular or unclassified patterns
    }
  });

  return { consistent, cramming, sporadic, binge, perfectionist };
}