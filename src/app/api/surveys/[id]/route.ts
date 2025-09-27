import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Survey } from '@/models/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Types } from 'mongoose';

// GET /api/surveys/[id] - Get a specific survey
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid survey ID' }, { status: 400 });
    }

    const survey = await Survey.findById(params.id).lean();

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json(
      { error: 'Failed to fetch survey' },
      { status: 500 }
    );
  }
}

// PUT /api/surveys/[id] - Update a survey
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid survey ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, triggerType, questions, isActive } = body;

    // Validate required fields
    if (!title || !triggerType || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Missing required fields: title, triggerType, questions' },
        { status: 400 }
      );
    }

    // Validate trigger type
    const validTriggerTypes = ['section_completion', 'flashcard_completion', 'media_completion'];
    if (!validTriggerTypes.includes(triggerType)) {
      return NextResponse.json(
        { error: 'Invalid trigger type' },
        { status: 400 }
      );
    }

    // Validate questions structure
    for (const question of questions) {
      if (!question.id || !question.type || !question.question) {
        return NextResponse.json(
          { error: 'Each question must have id, type, and question fields' },
          { status: 400 }
        );
      }

      const validQuestionTypes = ['rating', 'multiple_choice', 'text'];
      if (!validQuestionTypes.includes(question.type)) {
        return NextResponse.json(
          { error: 'Invalid question type' },
          { status: 400 }
        );
      }

      // Validate question type-specific requirements
      if (question.type === 'multiple_choice' && (!question.options || !Array.isArray(question.options))) {
        return NextResponse.json(
          { error: 'Multiple choice questions must have options array' },
          { status: 400 }
        );
      }

      if (question.type === 'rating' && (!question.scale || !question.scale.min || !question.scale.max)) {
        return NextResponse.json(
          { error: 'Rating questions must have scale with min and max values' },
          { status: 400 }
        );
      }
    }

    const survey = await Survey.findByIdAndUpdate(
      params.id,
      {
        title,
        description,
        triggerType,
        questions,
        isActive
      },
      { new: true, runValidators: true }
    );

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json(
      { error: 'Failed to update survey' },
      { status: 500 }
    );
  }
}

// DELETE /api/surveys/[id] - Delete a survey
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid survey ID' }, { status: 400 });
    }

    const survey = await Survey.findByIdAndDelete(params.id);

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return NextResponse.json(
      { error: 'Failed to delete survey' },
      { status: 500 }
    );
  }
}