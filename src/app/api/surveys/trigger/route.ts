import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Survey, SurveyResponse, QuestionSection, Topic, Subject } from '@/models/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Types } from 'mongoose';

// GET /api/surveys/trigger - Get survey to trigger based on completion context
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const triggerType = searchParams.get('triggerType');
    const contentId = searchParams.get('contentId'); // sectionId for section_completion, topicId for others

    if (!triggerType || !contentId) {
      return NextResponse.json(
        { error: 'Missing triggerType or contentId' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(contentId)) {
      return NextResponse.json(
        { error: 'Invalid contentId' },
        { status: 400 }
      );
    }

    const validTriggerTypes = ['section_completion', 'flashcard_completion', 'media_completion'];
    if (!validTriggerTypes.includes(triggerType)) {
      return NextResponse.json(
        { error: 'Invalid trigger type' },
        { status: 400 }
      );
    }

    // Get all active surveys of this trigger type
    const surveys = await Survey.find({
      triggerType,
      isActive: true
    }).lean();

    if (surveys.length === 0) {
      return NextResponse.json({ survey: null });
    }

    let matchingSurvey = null;

    // Check each survey to see if it targets the current content
    for (const survey of surveys) {
      let isMatch = false;

      if (survey.targeting?.type === 'all') {
        isMatch = true;
      } else if (triggerType === 'section_completion') {
        // For section completion, get section details
        const section = await QuestionSection.findById(contentId).populate('topicId');
        if (!section) continue;

        const topic = section.topicId as any;
        const subjectId = topic.subjectId;

        if (survey.targeting.type === 'specific_sections') {
          isMatch = survey.targeting.sectionIds?.some(id => id.toString() === contentId);
        } else if (survey.targeting.type === 'specific_topics') {
          isMatch = survey.targeting.topicIds?.some(id => id.toString() === topic._id.toString());
        } else if (survey.targeting.type === 'specific_subjects') {
          isMatch = survey.targeting.subjectIds?.some(id => id.toString() === subjectId.toString());
        }
      } else if (triggerType === 'flashcard_completion' || triggerType === 'media_completion') {
        // For flashcard/media completion, contentId is topicId
        const topic = await Topic.findById(contentId);
        if (!topic) continue;

        if (survey.targeting.type === 'specific_topics') {
          isMatch = survey.targeting.topicIds?.some(id => id.toString() === contentId);
        } else if (survey.targeting.type === 'specific_subjects') {
          isMatch = survey.targeting.subjectIds?.some(id => id.toString() === topic.subjectId.toString());
        }
      }

      if (isMatch) {
        // Check if user has already responded to this survey for this content
        const existingResponse = await SurveyResponse.findOne({
          surveyId: survey._id,
          userId: session.user.id,
          triggerContentId: contentId,
          triggerType
        });

        if (!existingResponse) {
          matchingSurvey = survey;
          break; // Use the first matching survey
        }
      }
    }

    if (!matchingSurvey) {
      return NextResponse.json({ survey: null });
    }

    return NextResponse.json({
      survey: {
        _id: matchingSurvey._id,
        title: matchingSurvey.title,
        description: matchingSurvey.description,
        triggerType: matchingSurvey.triggerType,
        questions: matchingSurvey.questions
      },
      triggerContentId: contentId,
      alreadyCompleted: false
    });
  } catch (error) {
    console.error('Error fetching trigger survey:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trigger survey' },
      { status: 500 }
    );
  }
}