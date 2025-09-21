import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SubjectService } from '@/lib/db-operations';
import { Subject, Topic, Question, Flashcard, Media } from '@/models/database';
import connectToDatabase from '@/lib/mongoose';

// GET /api/subjects - Get all subjects with content counts and totals
export async function GET() {
  try {
    await connectToDatabase();

    const subjects = await Subject.find({})
      .populate('prerequisiteId', 'name')
      .sort({ order: 1 })
      .lean();

    // Add content counts and calculated totals for each subject
    const subjectsWithData = await Promise.all(
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

        // Calculate totals from topics
        const totalEstimatedMinutes = topics.reduce((sum, topic) => sum + (topic.estimatedMinutes || 0), 0);
        const totalXpReward = topics.reduce((sum, topic) => sum + (topic.xpReward || 0), 0);
        const estimatedHours = Math.round((totalEstimatedMinutes / 60) * 10) / 10; // Round to 1 decimal

        return {
          ...subject,
          topicCount: topics.length,
          questionCount,
          flashcardCount,
          mediaCount,
          totalContent: questionCount + flashcardCount + mediaCount,
          estimatedHours,
          xpReward: totalXpReward
        };
      })
    );

    return NextResponse.json(subjectsWithData);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

// POST /api/subjects - Create new subject (Admin only)
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
    const { name, description, difficulty, order } = data;

    if (!name || !description || !difficulty || order === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, difficulty, order' },
        { status: 400 }
      );
    }

    const subject = await SubjectService.createSubject({
      name,
      description,
      imageUrl: data.imageUrl,
      isUnlocked: data.isUnlocked ?? true,
      order,
      difficulty,
      prerequisiteId: data.prerequisiteId
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}
