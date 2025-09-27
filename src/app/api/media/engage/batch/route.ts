import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MediaEngagementService } from '@/lib/db-operations';

// POST /api/media/engage/batch - Batch update multiple media engagements
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { engagements } = await request.json();

    if (!Array.isArray(engagements) || engagements.length === 0) {
      return NextResponse.json(
        { error: 'Invalid engagements array' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Validate and prepare engagement data
    const validEngagements = engagements
      .filter(eng => eng.mediaId && typeof eng.mediaId === 'string')
      .map(eng => ({
        userId,
        mediaId: eng.mediaId,
        isLiked: eng.isLiked,
        isSaved: eng.isSaved,
        incrementViewCount: eng.incrementViewCount,
        addWatchTime: eng.addWatchTime,
        // Enhanced tracking data
        actualWatchTime: eng.actualWatchTime,
        engagementScore: eng.engagementScore,
        isGenuineWatch: eng.isGenuineWatch,
        visibility: eng.visibility,
        seekEvents: eng.seekEvents,
        pauseEvents: eng.pauseEvents
      }));

    if (validEngagements.length === 0) {
      return NextResponse.json(
        { error: 'No valid engagements to process' },
        { status: 400 }
      );
    }

    // Batch update engagements
    await MediaEngagementService.batchUpdateEngagements(validEngagements);

    const response = {
      success: true,
      processed: validEngagements.length,
      message: `Successfully updated ${validEngagements.length} engagements`
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error handling batch engagement:', error);
    return NextResponse.json(
      { error: 'Failed to process batch engagement' },
      { status: 500 }
    );
  }
}