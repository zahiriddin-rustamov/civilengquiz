import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Media } from '@/models/database';
import { Types } from 'mongoose';

// POST /api/media/[id]/engage - Toggle like/save for media
export async function POST(
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
    const { action } = await request.json(); // 'like' or 'save'

    if (!['like', 'save'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "like" or "save"' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify media exists
    const media = await Media.findById(id);
    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    const userId = (session.user as any).id;

    // For now, we'll simulate the engagement data
    // In a real app, you'd have a separate UserEngagement collection
    const response = {
      success: true,
      action,
      mediaId: id,
      userId,
      message: `Media ${action}d successfully`
    };

    // You could track this in UserProgress or a separate engagement collection
    // For demo purposes, we'll just return success

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error handling engagement:', error);
    return NextResponse.json(
      { error: 'Failed to process engagement' },
      { status: 500 }
    );
  }
}