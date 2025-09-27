import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchYouTubeVideoData, extractYouTubeId } from '@/lib/youtube-api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    // Extract video ID from URL
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Fetch video metadata with original URL for auto-detection
    const videoData = await fetchYouTubeVideoData(videoId, url);
    if (!videoData) {
      return NextResponse.json({ error: 'Could not fetch video metadata. Video may be private or not exist.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: videoData
    });

  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube metadata' },
      { status: 500 }
    );
  }
}