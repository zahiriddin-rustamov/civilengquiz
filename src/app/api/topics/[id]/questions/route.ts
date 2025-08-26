import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { QuestionService, TopicService, SubjectService } from '@/lib/db-operations';

// GET /api/topics/[id]/questions - Get all questions for a topic
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

    const { id } = await params;
    // Verify topic exists
    const topic = await TopicService.getTopicById(id);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Get questions for this topic
    const questions = await QuestionService.getQuestionsByTopic(id);

    // Get subject information
    const subject = await SubjectService.getSubjectById(topic.subjectId as any);

    // Calculate total XP and estimated time
    const totalXP = questions.reduce((sum, q) => sum + q.points, 0);
    const estimatedTime = Math.max(questions.length * 2, 10); // 2 minutes per question, minimum 10

    const response = {
      topicName: topic.name,
      subjectName: subject?.name || 'Unknown Subject',
      questions: questions,
      totalXP,
      estimatedTime
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
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

    const { id } = await params;
    // Verify topic exists
    const topic = await TopicService.getTopicById(id);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    const { type, text, difficulty, points, order, data: questionData } = data;
    
    if (!type || !text || !difficulty || !points || order === undefined || !questionData) {
      return NextResponse.json(
        { error: 'Missing required fields: type, text, difficulty, points, order, data' },
        { status: 400 }
      );
    }

    const question = await QuestionService.createQuestion({
      topicId: id as any,
      type,
      text,
      imageUrl: data.imageUrl,
      difficulty,
      points,
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
