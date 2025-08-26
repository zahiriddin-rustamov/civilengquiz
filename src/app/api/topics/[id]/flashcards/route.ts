import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { FlashcardService, TopicService, SubjectService } from '@/lib/db-operations';

// GET /api/topics/[id]/flashcards - Get all flashcards for a topic
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

    // Get flashcards for this topic
    const flashcards = await FlashcardService.getFlashcardsByTopic(id);

    // Get subject information
    const subject = await SubjectService.getSubjectById(topic.subjectId as any);

    // Transform flashcards to match the expected UI format
    const transformedFlashcards = flashcards.map(card => ({
      id: card._id.toString(),
      front: card.front,
      back: card.back,
      difficulty: card.difficulty,
      category: card.category,
      tags: card.tags,
      masteryLevel: 'New', // TODO: Get from user progress
      reviewCount: 0, // TODO: Get from user progress
      lastReviewed: null // TODO: Get from user progress
    }));

    // Calculate totals
    const totalXP = flashcards.reduce((sum, f) => sum + f.points, 0);
    const estimatedTime = Math.max(flashcards.length * 1.5, 10); // 1.5 minutes per card

    const response = {
      topicName: topic.name,
      subjectName: subject?.name || 'Unknown Subject',
      flashcards: transformedFlashcards,
      totalXP,
      estimatedTime
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flashcards' },
      { status: 500 }
    );
  }
}

// POST /api/topics/[id]/flashcards - Create new flashcard (Admin only)
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
    const { front, back, difficulty, points, order } = data;
    
    if (!front || !back || !difficulty || !points || order === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: front, back, difficulty, points, order' },
        { status: 400 }
      );
    }

    const flashcard = await FlashcardService.createFlashcard({
      topicId: id as any,
      front,
      back,
      imageUrl: data.imageUrl,
      difficulty,
      points,
      order,
      tags: data.tags || [],
      category: data.category
    });

    return NextResponse.json(flashcard, { status: 201 });
  } catch (error) {
    console.error('Error creating flashcard:', error);
    return NextResponse.json(
      { error: 'Failed to create flashcard' },
      { status: 500 }
    );
  }
}
