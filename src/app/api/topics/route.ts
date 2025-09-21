import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Topic, Subject, Question, Flashcard, Media } from '@/models/database';
import { TopicService } from '@/lib/db-operations';

// GET /api/topics - Get all topics with content counts and subject info
export async function GET() {
  try {
    await connectToDatabase();

    // Fetch topics with subject information
    const topics = await Topic.find({})
      .populate('subjectId', 'name')
      .sort({ order: 1, createdAt: 1 });

    // Add content counts and calculated totals for each topic
    const topicsWithData = await Promise.all(
      topics.map(async (topic) => {
        const [
          questionCount,
          flashcardCount,
          mediaCount,
          questions,
          flashcards,
          media
        ] = await Promise.all([
          Question.countDocuments({ topicId: topic._id }),
          Flashcard.countDocuments({ topicId: topic._id }),
          Media.countDocuments({ topicId: topic._id }),
          Question.find({ topicId: topic._id }).lean(),
          Flashcard.find({ topicId: topic._id }).lean(),
          Media.find({ topicId: topic._id }).lean()
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

        return {
          ...topic.toObject(),
          subjectName: (topic.subjectId as any)?.name || 'Unknown Subject',
          contentCounts: {
            questions: questionCount,
            flashcards: flashcardCount,
            media: mediaCount
          },
          totalContent: questionCount + flashcardCount + mediaCount,
          estimatedMinutes: totalEstimatedMinutes,
          xpReward: totalXpReward
        };
      })
    );

    return NextResponse.json(topicsWithData);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

// POST /api/topics - Create new topic (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validate required fields
    const { name, description, subjectId, difficulty, order } = data;

    if (!name || !description || !subjectId || !difficulty || order === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, subjectId, difficulty, order' },
        { status: 400 }
      );
    }

    const topic = await TopicService.createTopic({
      name,
      description,
      longDescription: data.longDescription,
      imageUrl: data.imageUrl,
      subjectId,
      order,
      difficulty,
      isUnlocked: data.isUnlocked ?? true
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