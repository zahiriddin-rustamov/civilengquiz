import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MediaService, MediaEngagementService } from '@/lib/db-operations';

// POST /api/media/[id]/engage - Update engagement for media
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
    const body = await request.json();
    const { action, isLiked, isSaved, incrementViewCount, addWatchTime } = body;

    // Verify media exists
    const media = await MediaService.getMediaById(id);
    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    const userId = (session.user as any).id;

    // Update engagement based on the request
    const updateData: any = {
      userId,
      mediaId: id
    };

    // Handle legacy 'action' parameter for backward compatibility
    if (action === 'like') {
      updateData.isLiked = isLiked !== undefined ? isLiked : true;
    } else if (action === 'save') {
      updateData.isSaved = isSaved !== undefined ? isSaved : true;
    } else {
      // Handle direct field updates
      if (isLiked !== undefined) updateData.isLiked = isLiked;
      if (isSaved !== undefined) updateData.isSaved = isSaved;
    }

    if (incrementViewCount) updateData.incrementViewCount = true;
    if (addWatchTime && addWatchTime > 0) updateData.addWatchTime = addWatchTime;

    const engagement = await MediaEngagementService.updateEngagement(updateData);

    // Get updated engagement stats for this media
    const stats = await MediaEngagementService.getMediaEngagementStats(id);

    const response = {
      success: true,
      mediaId: id,
      userId,
      engagement: {
        isLiked: engagement.isLiked,
        isSaved: engagement.isSaved,
        viewCount: engagement.viewCount,
        totalWatchTime: engagement.totalWatchTime
      },
      stats: {
        totalLikes: stats.totalLikes,
        totalViews: stats.totalViews,
        totalSaves: stats.totalSaves,
        avgWatchTime: stats.avgWatchTime
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error handling engagement:', error);
    return NextResponse.json(
      { error: 'Failed to process engagement' },
      { status: 500 }
    );
  }
}