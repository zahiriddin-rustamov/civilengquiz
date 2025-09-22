import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MediaService, TopicService, SubjectService } from '@/lib/db-operations';

// GET /api/topics/[id]/media - Get all media for a topic
export async function GET(
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
    // Verify topic exists
    const topic = await TopicService.getTopicById(id);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Get media for this topic
    const mediaItems = await MediaService.getMediaByTopic(id);

    // Get subject information
    const subject = await SubjectService.getSubjectById(topic.subjectId as any);

    // Separate videos and shorts
    const videos = mediaItems
      .filter(item => item.videoType === 'video')
      .map(item => ({
        id: item._id.toString(),
        title: item.title,
        description: item.description,
        url: item.youtubeUrl,
        youtubeId: item.youtubeId,
        duration: item.duration || 0,
        thumbnail: item.thumbnail,
        difficulty: item.difficulty,
        points: item.xpReward,
        estimatedMinutes: item.estimatedMinutes,
        order: item.order,
        preVideoContent: item.preVideoContent || {
          learningObjectives: [],
          prerequisites: [],
          keyTerms: []
        },
        postVideoContent: item.postVideoContent || {
          keyConcepts: [],
          reflectionQuestions: [],
          practicalApplications: [],
          additionalResources: []
        }
      }));

    const shorts = mediaItems
      .filter(item => item.videoType === 'short')
      .map(item => ({
        id: item._id.toString(),
        title: item.title,
        description: item.description,
        url: item.youtubeUrl,
        youtubeId: item.youtubeId,
        duration: item.duration || 0,
        thumbnail: item.thumbnail,
        difficulty: item.difficulty,
        points: item.xpReward,
        order: item.order,
        likes: 0, // TODO: Implement like tracking
        views: 0, // TODO: Implement view tracking
        quizQuestions: [] // TODO: Add quiz questions to Media model
      }));

    // Calculate totals
    const totalXP = mediaItems.reduce((sum, m) => sum + m.xpReward, 0);
    const estimatedTime = mediaItems.reduce((sum, m) => sum + m.estimatedMinutes, 0);

    const response = {
      topicName: topic.name,
      subjectName: subject?.name || 'Unknown Subject',
      totalXP,
      estimatedTime: Math.max(estimatedTime, 10),
      videos,
      shorts
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// POST /api/topics/[id]/media - Create new media (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    // Verify topic exists
    const topic = await TopicService.getTopicById(id);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Validate required fields
    const {
      title,
      description,
      difficulty,
      xpReward,
      estimatedMinutes,
      order,
      youtubeUrl,
      videoType,
      preVideoContent,
      postVideoContent
    } = data;

    if (!title || !description || !difficulty || xpReward === undefined || estimatedMinutes === undefined || order === undefined || !youtubeUrl || !videoType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, difficulty, xpReward, estimatedMinutes, order, youtubeUrl, videoType' },
        { status: 400 }
      );
    }

    // Extract YouTube ID from URL
    const extractYouTubeId = (url: string): string | null => {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }
      return null;
    };

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const media = await MediaService.createMedia({
      topicId: id as any,
      title,
      description,
      difficulty,
      xpReward,
      estimatedMinutes,
      order,
      youtubeUrl,
      youtubeId,
      videoType,
      preVideoContent: preVideoContent || {
        learningObjectives: [],
        prerequisites: [],
        keyTerms: []
      },
      postVideoContent: postVideoContent || {
        keyConcepts: [],
        reflectionQuestions: [],
        practicalApplications: [],
        additionalResources: []
      }
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error('Error creating media:', error);
    return NextResponse.json(
      { error: 'Failed to create media' },
      { status: 500 }
    );
  }
}
