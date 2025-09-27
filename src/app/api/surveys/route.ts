import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Survey } from '@/models/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/surveys - Get all surveys (optionally filtered by trigger type)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const triggerType = searchParams.get('triggerType');
    const isActive = searchParams.get('isActive');

    let filter: any = {};

    if (triggerType) {
      filter.triggerType = triggerType;
    }

    if (isActive !== null) {
      filter.isActive = isActive === 'true';
    }

    const surveys = await Survey.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    );
  }
}

// POST /api/surveys - Create a new survey
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, triggerType, questions, targeting, isActive = true } = body;

    // Validate required fields
    if (!title || !triggerType || !questions || !Array.isArray(questions) || !targeting) {
      return NextResponse.json(
        { error: 'Missing required fields: title, triggerType, questions, targeting' },
        { status: 400 }
      );
    }

    // Validate targeting
    const validTargetingTypes = ['all', 'specific_sections', 'specific_topics', 'specific_subjects'];
    if (!validTargetingTypes.includes(targeting.type)) {
      return NextResponse.json(
        { error: 'Invalid targeting type' },
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

    const survey = new Survey({
      title,
      description,
      triggerType,
      targeting,
      questions,
      isActive
    });

    await survey.save();

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json(
      { error: 'Failed to create survey' },
      { status: 500 }
    );
  }
}