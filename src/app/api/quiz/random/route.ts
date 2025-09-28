import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Question, UserProgress, Topic, Subject } from '@/models/database';

// GET /api/quiz/random - Get a random set of questions for practice
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '10');
    const difficulty = searchParams.get('difficulty'); // Optional: 'Beginner', 'Intermediate', 'Advanced'
    const topicId = searchParams.get('topicId'); // Optional: specific topic
    const subjectId = searchParams.get('subjectId'); // Optional: specific subject

    const userId = session.user.id;
    await connectToDatabase();

    // Build query for questions
    const query: any = {};

    // If topic specified, limit to that topic
    if (topicId) {
      query.topicId = topicId;
    } else if (subjectId) {
      // If subject specified, get all topics in that subject
      const topics = await Topic.find({ subjectId }).select('_id');
      const topicIds = topics.map(t => t._id);
      query.topicId = { $in: topicIds };
    }

    // Filter by difficulty if specified
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Get user's progress to prioritize questions they haven't seen or struggled with
    const userProgress = await UserProgress.find({
      userId,
      contentType: 'question'
    }).lean();

    // Create a map of question performance
    const questionPerformance = new Map();
    userProgress.forEach(progress => {
      questionPerformance.set(progress.contentId.toString(), {
        score: progress.score || 0,
        attempts: progress.attempts || 0,
        completed: progress.completed
      });
    });

    // Get all available questions matching the criteria
    let allQuestions = await Question.find(query)
      .select('_id type questionText options correctAnswer difficulty topicId sectionId points')
      .lean();

    // Prioritize questions for better learning
    const prioritizedQuestions = allQuestions.map(question => {
      const questionId = question._id.toString();
      const performance = questionPerformance.get(questionId);

      let priority = 0;

      if (!performance) {
        // Never attempted - highest priority
        priority = 100;
      } else if (!performance.completed) {
        // Started but not completed
        priority = 80;
      } else if (performance.score < 70) {
        // Struggled with this question
        priority = 60 + (70 - performance.score) / 2;
      } else if (performance.attempts === 1 && performance.score < 100) {
        // Only attempted once and didn't get perfect
        priority = 40;
      } else {
        // Completed successfully
        priority = 20 - Math.min(performance.attempts, 10);
      }

      return {
        ...question,
        priority,
        userPerformance: performance
      };
    });

    // Sort by priority (higher priority first) and add some randomness
    prioritizedQuestions.sort((a, b) => {
      // Add random factor to avoid always getting same questions
      const randomFactor = Math.random() * 20;
      return (b.priority + randomFactor) - (a.priority - randomFactor);
    });

    // Take requested number of questions
    const selectedQuestions = prioritizedQuestions.slice(0, Math.min(count, prioritizedQuestions.length));

    // Shuffle selected questions for variety
    const shuffled = selectedQuestions.sort(() => Math.random() - 0.5);

    // Get topic and section names for context
    const enrichedQuestions = await Promise.all(
      shuffled.map(async (question) => {
        const topic = await Topic.findById(question.topicId).select('name subjectId');
        const subject = topic ? await Subject.findById(topic.subjectId).select('name') : null;

        return {
          id: question._id,
          type: question.type,
          questionText: question.questionText,
          options: question.options,
          correctAnswer: question.correctAnswer,
          difficulty: question.difficulty,
          points: question.points,
          topicName: topic?.name,
          subjectName: subject?.name,
          userPerformance: question.userPerformance
        };
      })
    );

    // Calculate quiz metadata
    const totalPoints = enrichedQuestions.reduce((sum, q) => sum + (q.points || 10), 0);
    const estimatedTime = enrichedQuestions.length * 1.5; // 1.5 minutes per question average

    return NextResponse.json({
      success: true,
      quiz: {
        questions: enrichedQuestions,
        totalQuestions: enrichedQuestions.length,
        totalPoints,
        estimatedTime,
        difficulty: difficulty || 'mixed',
        type: 'random'
      },
      metadata: {
        requestedCount: count,
        availableQuestions: allQuestions.length,
        prioritizationApplied: true
      }
    });
  } catch (error) {
    console.error('Error generating random quiz:', error);
    return NextResponse.json(
      { error: 'Failed to generate random quiz' },
      { status: 500 }
    );
  }
}