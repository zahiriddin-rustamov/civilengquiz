import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { UserProgress, UserInteraction } from '@/models/database';

// POST /api/tracking/progress - Update detailed progress with tracking metrics
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      contentId,
      contentType,
      topicId,
      subjectId,
      sectionId,
      completed,
      score,
      timeSpent,
      activeTime,
      totalTime,
      engagementScore,
      metadata
    } = body;

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'Content ID and type are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const userId = (session.user as any).id;

    // Update or create progress record
    const progressUpdate = await UserProgress.findOneAndUpdate(
      {
        userId,
        contentId,
        contentType
      },
      {
        $set: {
          topicId,
          subjectId,
          sectionId,
          completed: completed || false,
          score,
          lastAccessed: new Date()
        },
        $inc: {
          timeSpent: timeSpent || 0,
          attempts: 1
        },
        $push: {
          'data.sessions': {
            timestamp: new Date(),
            activeTime: activeTime || 0,
            totalTime: totalTime || 0,
            engagementScore: engagementScore || 100,
            metadata
          }
        }
      },
      { upsert: true, new: true }
    );

    // Also log as interaction for detailed analytics
    if (activeTime !== undefined || totalTime !== undefined) {
      await UserInteraction.create({
        userId,
        sessionId: body.sessionId || 'unknown',
        timestamp: new Date(),
        eventType: 'progress_update',
        contentType,
        contentId,
        eventData: {
          completed,
          score,
          timeSpent,
          activeTime,
          totalTime,
          engagementScore
        },
        activeTime,
        totalTime,
        metadata
      });
    }

    return NextResponse.json({
      success: true,
      progress: progressUpdate
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

// GET /api/tracking/progress - Get detailed progress analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const topicId = searchParams.get('topicId');
    const subjectId = searchParams.get('subjectId');

    await connectToDatabase();

    const userId = (session.user as any).id;

    // Build query
    const query: any = { userId };
    if (contentType) query.contentType = contentType;
    if (topicId) query.topicId = topicId;
    if (subjectId) query.subjectId = subjectId;

    // Get progress records
    const progressRecords = await UserProgress.find(query)
      .sort({ lastAccessed: -1 })
      .lean();

    // Get interaction analytics for the same content
    const contentIds = progressRecords.map(p => p.contentId);
    const interactions = await UserInteraction.aggregate([
      {
        $match: {
          userId,
          contentId: { $in: contentIds },
          eventType: { $in: ['view_start', 'view_end', 'progress_update', 'submit'] }
        }
      },
      {
        $group: {
          _id: '$contentId',
          totalInteractions: { $sum: 1 },
          avgActiveTime: { $avg: '$activeTime' },
          avgTotalTime: { $avg: '$totalTime' },
          lastInteraction: { $max: '$timestamp' }
        }
      }
    ]);

    // Combine progress and interaction data
    const interactionMap = new Map(interactions.map(i => [i._id.toString(), i]));
    const enhancedProgress = progressRecords.map(progress => ({
      ...progress,
      analytics: interactionMap.get(progress.contentId.toString()) || {
        totalInteractions: 0,
        avgActiveTime: 0,
        avgTotalTime: 0
      }
    }));

    return NextResponse.json({
      progress: enhancedProgress,
      count: enhancedProgress.length
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}