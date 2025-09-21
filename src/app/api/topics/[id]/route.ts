import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TopicService, QuestionService, FlashcardService, MediaService } from '@/lib/db-operations';

// GET /api/topics/[id] - Get topic by ID with content counts
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
    const topic = await TopicService.getTopicById(id);
    
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Get content counts for this topic
    const [questions, flashcards, media] = await Promise.all([
      QuestionService.getQuestionsByTopic(id),
      FlashcardService.getFlashcardsByTopic(id),
      MediaService.getMediaByTopic(id)
    ]);

    // Calculate totals from content
    const totalXpReward =
      questions.reduce((sum, q) => sum + (q.xpReward || 0), 0) +
      flashcards.reduce((sum, f) => sum + (f.xpReward || 0), 0) +
      media.reduce((sum, m) => sum + (m.xpReward || 0), 0);

    const totalEstimatedMinutes =
      questions.reduce((sum, q) => sum + (q.estimatedMinutes || 0), 0) +
      flashcards.reduce((sum, f) => sum + (f.estimatedMinutes || 0), 0) +
      media.reduce((sum, m) => sum + (m.estimatedMinutes || 0), 0);

    // Enhance topic with content information
    const enhancedTopic = {
      ...topic,
      xpReward: totalXpReward,
      estimatedMinutes: totalEstimatedMinutes,
      contentCounts: {
        questions: questions.length,
        flashcards: flashcards.length,
        media: media.length
      },
      // TODO: Add user progress calculation
      progress: 0,
      completedContent: {
        questions: 0,
        flashcards: 0,
        media: 0
      }
    };

    return NextResponse.json(enhancedTopic);
  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic' },
      { status: 500 }
    );
  }
}

// PUT /api/topics/[id] - Update topic (Admin only)
export async function PUT(
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
    const data = await request.json();
    const topic = await TopicService.updateTopic(id, data);
    
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    );
  }
}

// DELETE /api/topics/[id] - Delete topic (Admin only)
export async function DELETE(
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
    const deleted = await TopicService.deleteTopic(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic' },
      { status: 500 }
    );
  }
}
