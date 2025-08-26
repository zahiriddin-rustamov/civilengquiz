import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Media } from '@/models/database';
import { Types } from 'mongoose';

// GET /api/admin/media/[id] - Get single media
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const mediaId = params.id;

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
          subjectName: { $arrayElemAt: ['$subject.name', 0] }
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
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const mediaId = params.id;

    if (!Types.ObjectId.isValid(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    const body = await req.json();
    const {
      type,
      title,
      description,
      difficulty,
      points,
      order,
      data
    } = body;

    // Validate required fields
    if (!type || !title?.trim() || !description?.trim() || !difficulty || points === undefined || order === undefined || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate media type and data structure
    const validationResult = validateMediaData(type, data);
    if (!validationResult.valid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    // Update media
    const updatedMedia = await Media.findByIdAndUpdate(
      mediaId,
      {
        type,
        title: title.trim(),
        description: description.trim(),
        difficulty,
        points,
        order,
        data,
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
          subjectName: { $arrayElemAt: ['$subject.name', 0] }
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
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const mediaId = params.id;

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

// Validate media data based on type
function validateMediaData(type: string, data: any): { valid: boolean; error?: string } {
  switch (type) {
    case 'video':
      if (!data.url || typeof data.url !== 'string') {
        return { valid: false, error: 'Video must have a valid URL' };
      }
      if (data.duration && (typeof data.duration !== 'number' || data.duration <= 0)) {
        return { valid: false, error: 'Duration must be a positive number' };
      }
      break;

    case 'simulation':
      if (!data.url || typeof data.url !== 'string') {
        return { valid: false, error: 'Simulation must have a valid URL' };
      }
      if (data.parameters && typeof data.parameters !== 'object') {
        return { valid: false, error: 'Simulation parameters must be an object' };
      }
      break;

    case 'gallery':
      if (!Array.isArray(data.images) || data.images.length === 0) {
        return { valid: false, error: 'Gallery must have at least one image' };
      }
      for (const image of data.images) {
        if (!image.url || !image.caption) {
          return { valid: false, error: 'Each gallery image must have URL and caption' };
        }
      }
      break;

    default:
      return { valid: false, error: 'Invalid media type' };
  }

  return { valid: true };
}