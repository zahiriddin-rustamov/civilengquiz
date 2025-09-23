import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Question } from '@/models/database';
import { Types } from 'mongoose';

// GET /api/admin/questions/[id] - Get single question
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const questionId = id;

    if (!Types.ObjectId.isValid(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    // Get question with topic and subject information
    const question = await Question.aggregate([
      { $match: { _id: new Types.ObjectId(questionId) } },
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

    if (!question || question.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json(question[0]);

  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
  }
}

// PUT /api/admin/questions/[id] - Update question
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const questionId = id;

    if (!Types.ObjectId.isValid(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    const body = await req.json();
    const {
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
    if (!type || !text || !difficulty || points === undefined || order === undefined || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate question type and data structure
    const validationResult = validateQuestionData(type, data);
    if (!validationResult.valid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    // Update question
    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      {
        type,
        text,
        imageUrl,
        difficulty,
        points,
        order,
        data,
        explanation,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Get updated question with topic and subject information
    const populatedQuestion = await Question.aggregate([
      { $match: { _id: updatedQuestion._id } },
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

    return NextResponse.json(populatedQuestion[0]);

  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

// DELETE /api/admin/questions/[id] - Delete question
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const questionId = id;

    if (!Types.ObjectId.isValid(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    const deletedQuestion = await Question.findByIdAndDelete(questionId);

    if (!deletedQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // TODO: Also delete related user progress entries
    // await UserProgress.deleteMany({ contentId: questionId, contentType: 'question' });

    return NextResponse.json({ message: 'Question deleted successfully' });

  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
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