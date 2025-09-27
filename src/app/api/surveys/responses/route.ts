import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { SurveyResponse, Survey, QuestionSection, Topic } from '@/models/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Types } from 'mongoose';

// GET /api/surveys/responses - Get survey responses (admin only, with filtering)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('surveyId');
    const triggerType = searchParams.get('triggerType');
    const triggerContentId = searchParams.get('triggerContentId');
    const userId = searchParams.get('userId');

    let filter: any = {};

    if (surveyId && Types.ObjectId.isValid(surveyId)) {
      filter.surveyId = surveyId;
    }

    if (triggerType) {
      filter.triggerType = triggerType;
    }

    if (triggerContentId && Types.ObjectId.isValid(triggerContentId)) {
      filter.triggerContentId = triggerContentId;
    }

    if (userId && Types.ObjectId.isValid(userId)) {
      filter.userId = userId;
    }

    const responses = await SurveyResponse.find(filter)
      .populate('surveyId', 'title triggerType')
      .populate('userId', 'name email')
      .sort({ completedAt: -1 })
      .lean();

    // Enhance responses with content information
    const enhancedResponses = await Promise.all(
      responses.map(async (response) => {
        let contentInfo = null;

        if (response.triggerType === 'section_completion') {
          // Get section information
          const section = await QuestionSection.findById(response.triggerContentId)
            .populate('topicId', 'name subjectId')
            .lean();

          if (section) {
            const topic = section.topicId as any;
            contentInfo = {
              type: 'Section',
              name: section.name,
              topicName: topic?.name,
              path: `${topic?.name} → ${section.name}`
            };
          }
        } else if (response.triggerType === 'flashcard_completion' || response.triggerType === 'media_completion') {
          // Get topic information
          const topic = await Topic.findById(response.triggerContentId)
            .populate('subjectId', 'name')
            .lean();

          if (topic) {
            const subject = topic.subjectId as any;
            contentInfo = {
              type: response.triggerType === 'flashcard_completion' ? 'Flashcards' : 'Media',
              name: topic.name,
              subjectName: subject?.name,
              path: `${subject?.name} → ${topic.name}`
            };
          }
        }

        return {
          ...response,
          contentInfo
        };
      })
    );

    return NextResponse.json(enhancedResponses);
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch survey responses' },
      { status: 500 }
    );
  }
}

// POST /api/surveys/responses - Submit a survey response
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      surveyId,
      triggerContentId,
      triggerType,
      responses,
      timeSpent = 0
    } = body;

    // Validate required fields
    if (!surveyId || !triggerContentId || !triggerType || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: 'Missing required fields: surveyId, triggerContentId, triggerType, responses' },
        { status: 400 }
      );
    }

    // Validate IDs
    if (!Types.ObjectId.isValid(surveyId) || !Types.ObjectId.isValid(triggerContentId)) {
      return NextResponse.json(
        { error: 'Invalid surveyId or triggerContentId' },
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

    // Check if survey exists and is active
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    if (!survey.isActive) {
      return NextResponse.json({ error: 'Survey is not active' }, { status: 400 });
    }

    // Validate responses structure
    for (const response of responses) {
      if (!response.questionId || response.answer === undefined) {
        return NextResponse.json(
          { error: 'Each response must have questionId and answer' },
          { status: 400 }
        );
      }

      // Find corresponding question in survey
      const question = survey.questions.find(q => q.id === response.questionId);
      if (!question) {
        return NextResponse.json(
          { error: `Question ${response.questionId} not found in survey` },
          { status: 400 }
        );
      }

      // Validate required questions
      if (question.required && (response.answer === null || response.answer === undefined || response.answer === '')) {
        return NextResponse.json(
          { error: `Question "${question.question}" is required` },
          { status: 400 }
        );
      }

      // Validate answer format based on question type
      if (question.type === 'rating' && question.scale) {
        const answer = Number(response.answer);
        if (isNaN(answer) || answer < question.scale.min || answer > question.scale.max) {
          return NextResponse.json(
            { error: `Rating answer must be between ${question.scale.min} and ${question.scale.max}` },
            { status: 400 }
          );
        }
      }

      if (question.type === 'multiple_choice' && question.options) {
        if (!question.options.includes(response.answer)) {
          return NextResponse.json(
            { error: `Invalid multiple choice answer for question "${question.question}"` },
            { status: 400 }
          );
        }
      }
    }

    // Check if user has already responded to this survey for this trigger
    const existingResponse = await SurveyResponse.findOne({
      surveyId,
      userId: session.user.id,
      triggerContentId,
      triggerType
    });

    if (existingResponse) {
      return NextResponse.json(
        { error: 'You have already responded to this survey' },
        { status: 409 }
      );
    }

    // Create survey response
    const surveyResponse = new SurveyResponse({
      surveyId,
      userId: session.user.id,
      triggerContentId,
      triggerType,
      responses,
      timeSpent
    });

    await surveyResponse.save();

    return NextResponse.json(surveyResponse, { status: 201 });
  } catch (error) {
    console.error('Error submitting survey response:', error);
    return NextResponse.json(
      { error: 'Failed to submit survey response' },
      { status: 500 }
    );
  }
}