import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Media } from '@/models/database';
import { Types } from 'mongoose';

// GET /api/admin/media/[id] - Get single media
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id: mediaId } = await params;

    if (!Types.ObjectId.isValid(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    // Get media with topic and subject information
    const media = await Media.aggregate([
      { $match: { _id: new Types.ObjectId(mediaId) } },
      {
        $lookup: {
          from: 'topics',
          localField: 'topicId',
          foreignField: '_id',
          as: 'topic'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'topic.subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $addFields: {
          topicName: { $arrayElemAt: ['$topic.name', 0] },
          subjectName: { $arrayElemAt: ['$subject.name', 0] },
          subjectId: { $arrayElemAt: ['$topic.subjectId', 0] }
        }
      }
    ]);

    if (!media || media.length === 0) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json(media[0]);

  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

// PUT /api/admin/media/[id] - Update media
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id: mediaId } = await params;

    if (!Types.ObjectId.isValid(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    const body = await req.json();
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
    } = body;

    // Validate required fields
    if (!title?.trim() || !description?.trim() || !difficulty || xpReward === undefined || estimatedMinutes === undefined || order === undefined || !youtubeUrl?.trim() || !videoType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract YouTube ID from URL
    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Update media
    const updatedMedia = await Media.findByIdAndUpdate(
      mediaId,
      {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        xpReward,
        estimatedMinutes,
        order,
        youtubeUrl: youtubeUrl.trim(),
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
        },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Get updated media with topic and subject information
    const populatedMedia = await Media.aggregate([
      { $match: { _id: updatedMedia._id } },
      {
        $lookup: {
          from: 'topics',
          localField: 'topicId',
          foreignField: '_id',
          as: 'topic'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'topic.subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $addFields: {
          topicName: { $arrayElemAt: ['$topic.name', 0] },
          subjectName: { $arrayElemAt: ['$subject.name', 0] },
          subjectId: { $arrayElemAt: ['$topic.subjectId', 0] }
        }
      }
    ]);

    return NextResponse.json(populatedMedia[0]);

  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
  }
}

// DELETE /api/admin/media/[id] - Delete media
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id: mediaId } = await params;

    if (!Types.ObjectId.isValid(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    const deletedMedia = await Media.findByIdAndDelete(mediaId);

    if (!deletedMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // TODO: Also delete related user progress entries
    // await UserProgress.deleteMany({ contentId: mediaId, contentType: 'media' });

    return NextResponse.json({ message: 'Media deleted successfully' });

  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}

// Extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
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
}