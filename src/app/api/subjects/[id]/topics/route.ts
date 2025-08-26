import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TopicService, QuestionService, FlashcardService, MediaService } from '@/lib/db-operations';

// GET /api/subjects/[id]/topics - Get topics for a subject with content counts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topics = await TopicService.getTopicsBySubject(id);
    
    // Enhance topics with content counts
    const enhancedTopics = await Promise.all(
      topics.map(async (topic) => {
        const [questions, flashcards, media] = await Promise.all([
          QuestionService.getQuestionsByTopic(topic._id.toString()),
          FlashcardService.getFlashcardsByTopic(topic._id.toString()),
          MediaService.getMediaByTopic(topic._id.toString())
        ]);

        return {
          ...topic,
          contentCounts: {
            questions: questions.length,
            flashcards: flashcards.length,
            media: media.length
          }
        };
      })
    );
    
    return NextResponse.json(enhancedTopics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

// POST /api/subjects/[id]/topics - Create new topic (Admin only)
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
    const data = await request.json();
    
    // Validate required fields
    const { name, description, difficulty, estimatedMinutes, xpReward, order } = data;
    
    if (!name || !description || !difficulty || !estimatedMinutes || !xpReward || order === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, difficulty, estimatedMinutes, xpReward, order' },
        { status: 400 }
      );
    }

    const topic = await TopicService.createTopic({
      name,
      description,
      longDescription: data.longDescription,
      subjectId: id as any,
      order,
      isUnlocked: data.isUnlocked ?? true,
      difficulty,
      estimatedMinutes,
      xpReward
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    );
  }
}
