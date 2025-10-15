import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { QuestionSection, Question, UserProgress, Topic, Subject } from '@/models/database';

// GET /api/sections/[id]/questions - Get questions for a specific section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { id } = await params;

    // Get the section
    const section = await QuestionSection.findById(id)
      .populate('topicId');

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Get the topic and subject info
    const topic = await Topic.findById(section.topicId);
    const subject = await Subject.findById(topic?.subjectId);

    // Check if user has access to this section based on unlock conditions
    const userId = (session.user as any).id;
    let hasAccess = true;
    let unlockMessage = '';

    // Use topic's section settings instead of section.settings
    const sectionSettings = topic?.sectionSettings || {
      unlockConditions: 'always',
      requiredScore: 70,
      requireCompletion: false
    };

    // First, check if the current section is already completed
    // If so, keep it unlocked regardless of other conditions
    const currentSectionProgress = await UserProgress.findOne({
      userId,
      contentId: section._id.toString(),
      contentType: 'section'
    });

    const isCurrentSectionCompleted = currentSectionProgress && currentSectionProgress.completed;

    if (sectionSettings.unlockConditions === 'sequential') {
      // If current section is already completed, keep it unlocked
      if (isCurrentSectionCompleted) {
        hasAccess = true;
      } else {
        // Check if previous sections are completed
        const previousSections = await QuestionSection.find({
          topicId: section.topicId,
          order: { $lt: section.order }
        }).sort({ order: 1 });

        for (const prevSection of previousSections) {
          const sectionProgress = await UserProgress.findOne({
            userId,
            contentId: prevSection._id.toString(),
            contentType: 'section'
          });

          if (!sectionProgress || !sectionProgress.completed) {
            hasAccess = false;
            unlockMessage = `Complete "${prevSection.name}" section first`;
            break;
          }
        }
      }
    } else if (sectionSettings.unlockConditions === 'score-based') {
      // If current section is already completed, keep it unlocked
      if (isCurrentSectionCompleted) {
        hasAccess = true;
      } else {
        // Check if previous section meets score requirement
        const previousSection = await QuestionSection.findOne({
          topicId: section.topicId,
          order: section.order - 1
        });

        if (previousSection) {
          const sectionProgress = await UserProgress.findOne({
            userId,
            contentId: previousSection._id.toString(),
            contentType: 'section'
          });

          const requiredScore = sectionSettings.requiredScore || 70;
          if (!sectionProgress || (sectionProgress.score || 0) < requiredScore) {
            hasAccess = false;
            unlockMessage = `Score at least ${requiredScore}% in "${previousSection.name}" to unlock this section`;
          }
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json({
        error: 'Section locked',
        message: unlockMessage,
        hasAccess: false
      }, { status: 403 });
    }

    // Get questions for this section
    const questions = await Question.find({ sectionId: id })
      .sort({ order: 1 });

    // Calculate total XP and estimated time
    const totalXP = questions.reduce((sum, q) => sum + (q.xpReward || 0), 0);
    const estimatedTime = Math.max(questions.length * 2, 5); // 2 minutes per question, minimum 5

    // Get user's progress on this section
    const sectionProgress = await UserProgress.findOne({
      userId,
      contentId: section._id.toString(),
      contentType: 'section'
    });

    const response = {
      section: {
        id: section._id,
        name: section.name,
        description: section.description,
        settings: sectionSettings,
        progress: sectionProgress
      },
      topicName: topic?.name || 'Unknown Topic',
      subjectName: subject?.name || 'Unknown Subject',
      questions: questions.map(q => ({
        id: q._id.toString(),
        type: q.type,
        data: {
          id: q._id.toString(),
          text: q.text,
          difficulty: q.difficulty,
          points: q.xpReward,
          explanation: q.explanation,
          ...q.data
        }
      })),
      totalXP,
      estimatedTime,
      hasAccess: true
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching section questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section questions' },
      { status: 500 }
    );
  }
}