import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Question, Topic, Subject, QuestionSection } from '@/models/database';

// GET /api/topics/[id]/questions - Get sections and questions overview for a topic
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

    // Verify topic exists
    const topic = await Topic.findById(id);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Get subject information
    const subject = await Subject.findById(topic.subjectId);

    // Get all sections for this topic
    const sections = await QuestionSection.find({ topicId: id })
      .sort({ order: 1 });

    if (sections.length === 0) {
      return NextResponse.json({
        topicName: topic.name,
        subjectName: subject?.name || 'Unknown Subject',
        sections: [],
        totalXP: 0,
        estimatedTime: 0,
        message: 'No sections found for this topic'
      });
    }

    // Get sections with question counts and metadata
    const sectionsWithMetadata = await Promise.all(
      sections.map(async (section) => {
        const questions = await Question.find({ sectionId: section._id })
          .sort({ order: 1 });

        const totalXP = questions.reduce((sum, q) => sum + (q.xpReward || 0), 0);
        const estimatedTime = Math.max(questions.length * 2, 5);

        return {
          id: section._id,
          name: section.name,
          description: section.description,
          order: section.order,
          settings: section.settings,
          questionCount: questions.length,
          totalXP,
          estimatedTime
        };
      })
    );

    const totalXP = sectionsWithMetadata.reduce((sum, s) => sum + s.totalXP, 0);
    const totalEstimatedTime = sectionsWithMetadata.reduce((sum, s) => sum + s.estimatedTime, 0);

    const response = {
      topicName: topic.name,
      subjectName: subject?.name || 'Unknown Subject',
      sections: sectionsWithMetadata,
      totalXP,
      estimatedTime: totalEstimatedTime
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching topic sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic sections' },
      { status: 500 }
    );
  }
}

// POST /api/topics/[id]/questions - Create new question (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { id } = await params;

    // Verify topic exists
    const topic = await Topic.findById(id);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Validate required fields
    const { sectionId, type, text, difficulty, points, order, data: questionData } = data;

    if (!sectionId || !type || !text || !difficulty || !points || order === undefined || !questionData) {
      return NextResponse.json(
        { error: 'Missing required fields: sectionId, type, text, difficulty, points, order, data' },
        { status: 400 }
      );
    }

    // Verify section exists and belongs to the topic
    const section = await QuestionSection.findById(sectionId);
    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }
    if (section.topicId.toString() !== id) {
      return NextResponse.json(
        { error: 'Section does not belong to the specified topic' },
        { status: 400 }
      );
    }

    const question = await Question.create({
      topicId: id,
      sectionId,
      type,
      text,
      imageUrl: data.imageUrl,
      difficulty,
      xpReward: points,
      estimatedMinutes: Math.ceil(points / 10),
      order,
      data: questionData,
      explanation: data.explanation
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
