import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Question, Topic } from '@/models/database';
import { Types } from 'mongoose';

// GET /api/admin/questions - List all questions with filtering
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (topicId) query.topicId = new Types.ObjectId(topicId);
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;

    // Get questions with topic information
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
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST /api/admin/questions - Create new question
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const {
      topicId,
      type,
      text,
      imageUrl,
      difficulty,
      points,
      order,
      data,
      explanation
    } = body;

    // Validate required fields
    if (!topicId || !type || !text || !difficulty || points === undefined || order === undefined || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Validate question type and data structure
    const validationResult = validateQuestionData(type, data);
    if (!validationResult.valid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    // Create question
    const question = new Question({
      topicId: new Types.ObjectId(topicId),
      type,
      text,
      imageUrl,
      difficulty,
      points,
      order,
      data,
      explanation
    });

    await question.save();

    // Populate topic and subject information for response
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
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

// Validate question data based on type
function validateQuestionData(type: string, data: any): { valid: boolean; error?: string } {
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