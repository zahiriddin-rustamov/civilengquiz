import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { UserProgress } from '@/models/database';

// GET /api/user/progress/sections - Get user's section progress for a topic
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json(
        { error: 'topicId is required' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Get all section progress for this topic
    const sectionProgress = await UserProgress.find({
      userId,
      topicId,
      contentType: 'section'
    }).sort({ updatedAt: -1 });

    // Transform the progress data
    const progressData = sectionProgress.map(progress => ({
      sectionId: progress.contentId.toString(),
      completed: progress.completed,
      score: progress.score || 0,
      questionsAnswered: progress.data?.questionsAnswered || 0,
      totalQuestions: progress.data?.totalQuestions || 0,
      timeSpent: progress.timeSpent,
      lastAccessed: progress.lastAccessed,
      attempts: progress.attempts
    }));

    return NextResponse.json(progressData);
  } catch (error) {
    console.error('Error fetching section progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section progress' },
      { status: 500 }
    );
  }
}