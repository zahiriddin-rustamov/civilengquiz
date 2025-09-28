import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { SessionTracking } from '@/models/database';

// POST /api/tracking/session - Save or update session data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Handle both JSON and sendBeacon (which sends as text)
    let body;
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else {
      // Handle sendBeacon which sends as text
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json(
          { error: 'Invalid data format' },
          { status: 400 }
        );
      }
    }

    if (!body.sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Prepare session data
    const sessionData = {
      sessionId: body.sessionId,
      userId: body.userId || (session?.user ? (session.user as any).id : null),
      startTime: new Date(body.startTime),
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      duration: body.duration || 0,
      activeDuration: body.activeDuration || 0,
      navigationPath: body.navigationPath || [],
      contentInteractions: body.contentInteractions || [],
      engagementMetrics: body.engagementMetrics || {
        totalTime: 0,
        activeTime: 0,
        idleTime: 0,
        engagementScore: 100,
        idlePeriods: []
      },
      deviceInfo: body.deviceInfo || {}
    };

    // Update or create session
    await SessionTracking.findOneAndUpdate(
      { sessionId: body.sessionId },
      sessionData,
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      sessionId: body.sessionId
    });
  } catch (error) {
    console.error('Error saving session data:', error);
    return NextResponse.json(
      { error: 'Failed to save session data' },
      { status: 500 }
    );
  }
}

// GET /api/tracking/session - Get session data
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
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '10');

    await connectToDatabase();

    if (sessionId) {
      // Get specific session
      const sessionData = await SessionTracking.findOne({ sessionId });

      if (!sessionData) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(sessionData);
    } else {
      // Get recent sessions for the user
      const userId = (session.user as any).id;
      const sessions = await SessionTracking
        .find({ userId })
        .sort({ startTime: -1 })
        .limit(limit);

      return NextResponse.json({
        sessions,
        count: sessions.length
      });
    }
  } catch (error) {
    console.error('Error fetching session data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session data' },
      { status: 500 }
    );
  }
}