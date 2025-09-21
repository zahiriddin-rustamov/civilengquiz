import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Topic } from '@/models/database';

// POST /api/topics/reorder - Reorder topics (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { updates } = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      );
    }

    // Update all topics in parallel
    const updatePromises = updates.map(({ topicId, order }) =>
      Topic.findByIdAndUpdate(topicId, { order }, { new: true })
    );

    const updatedTopics = await Promise.all(updatePromises);

    // Check if any updates failed
    const failedUpdates = updatedTopics.filter(topic => !topic);
    if (failedUpdates.length > 0) {
      return NextResponse.json(
        { error: 'Some topics could not be updated' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Topics reordered successfully',
      updatedCount: updatedTopics.length
    });

  } catch (error) {
    console.error('Error reordering topics:', error);
    return NextResponse.json(
      { error: 'Failed to reorder topics' },
      { status: 500 }
    );
  }
}