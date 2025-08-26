import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Media, Topic } from '@/models/database';
import { Types } from 'mongoose';

// GET /api/admin/media - List all media with filtering
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (topicId) query.topicId = new Types.ObjectId(topicId);
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;

    // Get media with topic information
    const media = await Media.aggregate([
      { $match: query },
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
      },
      { $sort: { 'topic.order': 1, order: 1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total count for pagination
    const totalCount = await Media.countDocuments(query);

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

// POST /api/admin/media - Create new media
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const {
      topicId,
      type,
      title,
      description,
      difficulty,
      points,
      order,
      data
    } = body;

    // Validate required fields
    if (!topicId || !type || !title?.trim() || !description?.trim() || !difficulty || points === undefined || order === undefined || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Validate media type and data structure
    const validationResult = validateMediaData(type, data);
    if (!validationResult.valid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    // Create media
    const media = new Media({
      topicId: new Types.ObjectId(topicId),
      type,
      title: title.trim(),
      description: description.trim(),
      difficulty,
      points,
      order,
      data
    });

    await media.save();

    // Populate topic and subject information for response
    const populatedMedia = await Media.aggregate([
      { $match: { _id: media._id } },
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

    return NextResponse.json(populatedMedia[0], { status: 201 });

  } catch (error) {
    console.error('Error creating media:', error);
    return NextResponse.json({ error: 'Failed to create media' }, { status: 500 });
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