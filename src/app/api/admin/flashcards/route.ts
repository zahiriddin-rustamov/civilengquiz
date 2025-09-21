import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Flashcard, Topic } from '@/models/database';
import { Types } from 'mongoose';

// GET /api/admin/flashcards - List all flashcards with filtering
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');
    const difficulty = searchParams.get('difficulty');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (topicId) query.topicId = new Types.ObjectId(topicId);
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;

    // Get flashcards with topic information
    const flashcards = await Flashcard.aggregate([
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
    const totalCount = await Flashcard.countDocuments(query);

    // Get unique categories for filtering
    const categories = await Flashcard.distinct('category', query);

    return NextResponse.json({
      flashcards,
      categories: categories.filter(Boolean), // Remove null/empty categories
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 });
  }
}

// POST /api/admin/flashcards - Create new flashcard
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
      front,
      back,
      imageUrl,
      difficulty,
      xpReward,
      estimatedMinutes,
      order,
      tags,
      category
    } = body;

    // Handle backward compatibility for points/xpReward
    const rewardPoints = xpReward !== undefined ? xpReward : (body.points || 10);
    const estMinutes = estimatedMinutes !== undefined ? estimatedMinutes : 2;

    // Validate required fields
    if (!topicId || !front?.trim() || !back?.trim() || !difficulty || rewardPoints === undefined || order === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Create flashcard
    const flashcard = new Flashcard({
      topicId: new Types.ObjectId(topicId),
      front: front.trim(),
      back: back.trim(),
      imageUrl,
      difficulty,
      xpReward: rewardPoints,
      estimatedMinutes: estMinutes,
      order,
      tags: Array.isArray(tags) ? tags.filter(tag => tag.trim()) : [],
      category: category?.trim() || undefined
    });

    await flashcard.save();

    // Populate topic and subject information for response
    const populatedFlashcard = await Flashcard.aggregate([
      { $match: { _id: flashcard._id } },
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

    return NextResponse.json(populatedFlashcard[0], { status: 201 });

  } catch (error) {
    console.error('Error creating flashcard:', error);
    return NextResponse.json({ error: 'Failed to create flashcard' }, { status: 500 });
  }
}

// POST /api/admin/flashcards/bulk - Bulk create flashcards
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { flashcards } = body;

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json({ error: 'Invalid flashcards data' }, { status: 400 });
    }

    // Validate all flashcards
    for (const flashcard of flashcards) {
      if (!flashcard.topicId || !flashcard.front?.trim() || !flashcard.back?.trim()) {
        return NextResponse.json({ error: 'All flashcards must have topicId, front, and back content' }, { status: 400 });
      }
    }

    // Transform and create flashcards
    const flashcardDocs = flashcards.map((fc, index) => ({
      topicId: new Types.ObjectId(fc.topicId),
      front: fc.front.trim(),
      back: fc.back.trim(),
      imageUrl: fc.imageUrl,
      difficulty: fc.difficulty || 'Beginner',
      xpReward: fc.xpReward !== undefined ? fc.xpReward : (fc.points || 10),
      estimatedMinutes: fc.estimatedMinutes !== undefined ? fc.estimatedMinutes : 2,
      order: fc.order || index + 1,
      tags: Array.isArray(fc.tags) ? fc.tags.filter(tag => tag.trim()) : [],
      category: fc.category?.trim() || undefined
    }));

    const createdFlashcards = await Flashcard.insertMany(flashcardDocs);

    return NextResponse.json({ 
      message: `Successfully created ${createdFlashcards.length} flashcards`,
      count: createdFlashcards.length 
    }, { status: 201 });

  } catch (error) {
    console.error('Error bulk creating flashcards:', error);
    return NextResponse.json({ error: 'Failed to create flashcards' }, { status: 500 });
  }
}