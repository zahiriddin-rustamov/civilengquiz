import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Topic, Subject, Question, Flashcard, Media } from '@/models/database';

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch topics with subject information
    const topics = await Topic.find({})
      .populate('subjectId', 'name')
      .sort({ order: 1, createdAt: 1 });

    // Get content counts for each topic
    const enhancedTopics = await Promise.all(
      topics.map(async (topic) => {
        const [questionCount, flashcardCount, mediaCount] = await Promise.all([
          Question.countDocuments({ topicId: topic._id }),
          Flashcard.countDocuments({ topicId: topic._id }),
          Media.countDocuments({ topicId: topic._id })
        ]);

        return {
          ...topic.toObject(),
          subjectName: (topic.subjectId as any)?.name || 'Unknown Subject',
          contentCounts: {
            questions: questionCount,
            flashcards: flashcardCount,
            media: mediaCount
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