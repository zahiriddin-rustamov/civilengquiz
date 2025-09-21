import { NextResponse } from 'next/server';
import { Subject, Topic, Question, Flashcard, Media } from '@/models/database';
import connectToDatabase from '@/lib/mongoose';

// GET /api/subjects/enhanced - Get all subjects with content counts and prerequisites
export async function GET() {
  try {
    await connectToDatabase();

    const subjects = await Subject.find({})
      .populate('prerequisiteId', 'name')
      .sort({ order: 1 })
      .lean();

    // Get content counts for each subject
    const enhancedSubjects = await Promise.all(
      subjects.map(async (subject) => {
        // Get topics for this subject
        const topics = await Topic.find({ subjectId: subject._id }).lean();
        const topicIds = topics.map(topic => topic._id);

        // Count content across all topics in this subject
        const [questionCount, flashcardCount, mediaCount] = await Promise.all([
          Question.countDocuments({ topicId: { $in: topicIds } }),
          Flashcard.countDocuments({ topicId: { $in: topicIds } }),
          Media.countDocuments({ topicId: { $in: topicIds } })
        ]);

        return {
          ...subject,
          topicCount: topics.length,
          questionCount,
          flashcardCount,
          mediaCount,
          totalContent: questionCount + flashcardCount + mediaCount
        };
      })
    );

    return NextResponse.json(enhancedSubjects);

  } catch (error) {
    console.error('Error fetching enhanced subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects with content counts' },
      { status: 500 }
    );
  }
}