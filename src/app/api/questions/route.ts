import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Question, Topic } from '@/models/database';
import { QuestionService } from '@/lib/db-operations';
import { Types } from 'mongoose';

// GET /api/questions - Get all questions with filtering
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (topicId) query.topicId = new Types.ObjectId(topicId);
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;

    // Get questions with topic and subject information
    const questions = await Question.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'topics',
          localField: 'topicId',
          foreignField: '_id',
          as: 'topic'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'topic.subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $addFields: {
          topicName: { $arrayElemAt: ['$topic.name', 0] },
          subjectName: { $arrayElemAt: ['$subject.name', 0] }
        }
      },
      { $sort: { 'topic.order': 1, order: 1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total count for pagination
    const totalCount = await Question.countDocuments(query);

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST /api/questions - Create new question (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validate required fields
    const { topicId, type, text, difficulty, xpReward, estimatedMinutes } = data;

    if (!topicId || !type || !text || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: topicId, type, text, difficulty' },
        { status: 400 }
      );
    }

    // Validate topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Validate question data structure
    const validationResult = validateQuestionData(type, data.data);
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    // Additional validation for fill-in-blank questions
    if (type === 'fill-in-blank') {
      const blankValidation = validateFillInBlankText(text, data.data);
      if (!blankValidation.valid) {
        return NextResponse.json(
          { error: blankValidation.error },
          { status: 400 }
        );
      }
    }

    // Auto-calculate next order value within the topic
    const existingQuestions = await Question.find({ topicId }).sort({ order: -1 }).limit(1);
    const nextOrder = existingQuestions.length > 0 ? existingQuestions[0].order + 1 : 1;

    const question = await QuestionService.createQuestion({
      topicId,
      type,
      text,
      imageUrl: data.imageUrl,
      difficulty,
      xpReward: xpReward || getDefaultXpReward(difficulty, type),
      estimatedMinutes: estimatedMinutes || getDefaultEstimatedMinutes(type),
      order: nextOrder,
      data: data.data,
      explanation: data.explanation
    });

    // Return question with populated topic and subject info
    const populatedQuestion = await Question.aggregate([
      { $match: { _id: question._id } },
      {
        $lookup: {
          from: 'topics',
          localField: 'topicId',
          foreignField: '_id',
          as: 'topic'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'topic.subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $addFields: {
          topicName: { $arrayElemAt: ['$topic.name', 0] },
          subjectName: { $arrayElemAt: ['$subject.name', 0] }
        }
      }
    ]);

    return NextResponse.json(populatedQuestion[0], { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

// Helper function to get default XP reward based on difficulty and type
function getDefaultXpReward(difficulty: string, type: string): number {
  const basePoints = {
    'multiple-choice': 5,
    'true-false': 3,
    'fill-in-blank': 7,
    'numerical': 8,
    'matching': 6
  };

  const difficultyMultiplier = {
    'Beginner': 1,
    'Intermediate': 1.5,
    'Advanced': 2
  };

  const base = basePoints[type as keyof typeof basePoints] || 5;
  const multiplier = difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier] || 1;

  return Math.round(base * multiplier);
}

// Helper function to get default estimated minutes based on type
function getDefaultEstimatedMinutes(type: string): number {
  const timeEstimates = {
    'multiple-choice': 1,
    'true-false': 0.5,
    'fill-in-blank': 2,
    'numerical': 3,
    'matching': 2
  };

  return timeEstimates[type as keyof typeof timeEstimates] || 2;
}

// Validate question data based on type
function validateQuestionData(type: string, data: any): { valid: boolean; error?: string } {
  if (!data) {
    return { valid: false, error: 'Question data is required' };
  }

  switch (type) {
    case 'multiple-choice':
      if (!Array.isArray(data.options) || data.options.length < 2) {
        return { valid: false, error: 'Multiple choice questions must have at least 2 options' };
      }
      if (typeof data.correctAnswer !== 'number' || data.correctAnswer < 0 || data.correctAnswer >= data.options.length) {
        return { valid: false, error: 'Invalid correct answer index for multiple choice question' };
      }
      break;

    case 'true-false':
      if (typeof data.correctAnswer !== 'boolean') {
        return { valid: false, error: 'True/false questions must have a boolean correct answer' };
      }
      break;

    case 'fill-in-blank':
      if (!Array.isArray(data.blanks) || data.blanks.length === 0) {
        return { valid: false, error: 'Fill-in-blank questions must have at least one blank' };
      }
      for (const blank of data.blanks) {
        if (!blank.id || !Array.isArray(blank.correctAnswers) || blank.correctAnswers.length === 0) {
          return { valid: false, error: 'Each blank must have an ID and at least one correct answer' };
        }
      }
      break;

    case 'numerical':
      if (typeof data.correctAnswer !== 'number') {
        return { valid: false, error: 'Numerical questions must have a numeric correct answer' };
      }
      if (data.tolerance !== undefined && (typeof data.tolerance !== 'number' || data.tolerance < 0)) {
        return { valid: false, error: 'Tolerance must be a positive number' };
      }
      break;

    case 'matching':
      if (!Array.isArray(data.pairs) || data.pairs.length < 2) {
        return { valid: false, error: 'Matching questions must have at least 2 pairs' };
      }
      for (const pair of data.pairs) {
        if (!pair.id || !pair.left || !pair.right) {
          return { valid: false, error: 'Each pair must have id, left, and right properties' };
        }
      }
      break;

    default:
      return { valid: false, error: 'Invalid question type' };
  }

  return { valid: true };
}

// Validate fill-in-blank question text contains appropriate blank markers
function validateFillInBlankText(text: string, data: any): { valid: boolean; error?: string } {
  const blankMarkers = /___+|\{blank\}/gi;
  const markersInText = text.match(blankMarkers);
  const markerCount = markersInText ? markersInText.length : 0;

  if (markerCount === 0) {
    return {
      valid: false,
      error: 'Fill-in-blank questions must contain blank markers (_____ or {blank}) in the question text'
    };
  }

  if (markerCount !== data.blanks.length) {
    return {
      valid: false,
      error: `Number of blank markers in question text (${markerCount}) must match number of configured blanks (${data.blanks.length})`
    };
  }

  return { valid: true };
}