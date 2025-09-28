import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { UserInteraction } from '@/models/database';

// POST /api/tracking/interactions - Batch log user interactions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { events } = body;

    console.log('Received tracking events:', events?.length || 0);

    if (!events || !Array.isArray(events)) {
      console.error('Invalid events data:', body);
      return NextResponse.json(
        { error: 'Invalid events data' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Process events
    const interactions = events.map(event => ({
      userId: session?.user ? (session.user as any).id : null,
      sessionId: event.sessionId || 'anonymous',
      timestamp: new Date(event.timestamp || Date.now()),
      eventType: event.eventType,
      contentType: event.eventData?.contentType,
      contentId: event.eventData?.contentId,
      eventData: event.eventData,
      activeTime: event.eventData?.activeTime,
      totalTime: event.eventData?.totalTime,
      metadata: event.eventData?.metadata || event.metadata
    }));

    // Batch insert interactions
    try {
      const result = await UserInteraction.insertMany(interactions, { ordered: false });
      console.log('Successfully inserted interactions:', result.length);
    } catch (insertError: any) {
      console.error('Error inserting interactions:', insertError);
      // If it's a duplicate key error, it's okay to continue
      if (insertError.code !== 11000) {
        throw insertError;
      }
    }

    return NextResponse.json({
      success: true,
      processed: interactions.length
    });
  } catch (error) {
    console.error('Error logging interactions:', error);
    return NextResponse.json(
      { error: 'Failed to log interactions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}