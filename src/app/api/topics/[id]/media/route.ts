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

    // Separate media by type
    const videos = mediaItems
      .filter(item => item.type === 'video')
      .map(item => ({
        id: item._id.toString(),
        title: item.title,
        description: item.description,
        url: item.data.url || '',
        duration: item.data.duration || 0,
        thumbnail: item.data.thumbnail,
        difficulty: item.difficulty,
        points: item.points,
        topics: item.data.topics || []
      }));

    const simulations = mediaItems
      .filter(item => item.type === 'simulation')
      .map(item => ({
        id: item._id.toString(),
        title: item.title,
        description: item.description,
        type: item.data.simulationType || 'generic',
        difficulty: item.difficulty,
        points: item.points,
        parameters: item.data.parameters || [],
        learningObjectives: item.data.learningObjectives || []
      }));

    const galleries = mediaItems
      .filter(item => item.type === 'gallery')
      .map(item => ({
        id: item._id.toString(),
        title: item.title,
        description: item.description,
        category: item.data.category || 'photos',
        difficulty: item.difficulty,
        points: item.points,
        images: item.data.images || []
      }));

    // Calculate totals
    const totalXP = mediaItems.reduce((sum, m) => sum + m.points, 0);
    const estimatedTime = mediaItems.reduce((sum, m) => {
      if (m.type === 'video' && m.data.duration) {
        return sum + Math.ceil(m.data.duration / 60); // Convert seconds to minutes
      }
      return sum + 5; // Default 5 minutes for other media types
    }, 0);

    const response = {
      topicName: topic.name,
      subjectName: subject?.name || 'Unknown Subject',
      totalXP,
      estimatedTime: Math.max(estimatedTime, 10),
      videos,
      simulations,
      galleries
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
    const { type, title, description, difficulty, points, order, data: mediaData } = data;
    
    if (!type || !title || !description || !difficulty || !points || order === undefined || !mediaData) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, description, difficulty, points, order, data' },
        { status: 400 }
      );
    }

    const media = await MediaService.createMedia({
      topicId: id as any,
      type,
      title,
      description,
      difficulty,
      points,
      order,
      data: mediaData
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
