import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Flashcard } from '@/models/database';
import { Types } from 'mongoose';

// GET /api/admin/flashcards/[id] - Get single flashcard
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const flashcardId = params.id;

    if (!Types.ObjectId.isValid(flashcardId)) {
      return NextResponse.json({ error: 'Invalid flashcard ID' }, { status: 400 });
    }

    // Get flashcard with topic and subject information
    const flashcard = await Flashcard.aggregate([
      { $match: { _id: new Types.ObjectId(flashcardId) } },
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

    if (!flashcard || flashcard.length === 0) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    return NextResponse.json(flashcard[0]);

  } catch (error) {
    console.error('Error fetching flashcard:', error);
    return NextResponse.json({ error: 'Failed to fetch flashcard' }, { status: 500 });
  }
}

// PUT /api/admin/flashcards/[id] - Update flashcard
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const flashcardId = params.id;

    if (!Types.ObjectId.isValid(flashcardId)) {
      return NextResponse.json({ error: 'Invalid flashcard ID' }, { status: 400 });
    }

    const body = await req.json();
    const {
      front,
      back,
      imageUrl,
      difficulty,
      points,
      order,
      tags,
      category
    } = body;

    // Validate required fields
    if (!front?.trim() || !back?.trim() || !difficulty || points === undefined || order === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update flashcard
    const updatedFlashcard = await Flashcard.findByIdAndUpdate(
      flashcardId,
      {
        front: front.trim(),
        back: back.trim(),
        imageUrl,
        difficulty,
        points,
        order,
        tags: Array.isArray(tags) ? tags.filter(tag => tag.trim()) : [],
        category: category?.trim() || undefined,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedFlashcard) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    // Get updated flashcard with topic and subject information
    const populatedFlashcard = await Flashcard.aggregate([
      { $match: { _id: updatedFlashcard._id } },
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

    return NextResponse.json(populatedFlashcard[0]);

  } catch (error) {
    console.error('Error updating flashcard:', error);
    return NextResponse.json({ error: 'Failed to update flashcard' }, { status: 500 });
  }
}

// DELETE /api/admin/flashcards/[id] - Delete flashcard
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const flashcardId = params.id;

    if (!Types.ObjectId.isValid(flashcardId)) {
      return NextResponse.json({ error: 'Invalid flashcard ID' }, { status: 400 });
    }

    const deletedFlashcard = await Flashcard.findByIdAndDelete(flashcardId);

    if (!deletedFlashcard) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    // TODO: Also delete related user progress entries
    // await UserProgress.deleteMany({ contentId: flashcardId, contentType: 'flashcard' });

    return NextResponse.json({ message: 'Flashcard deleted successfully' });

  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return NextResponse.json({ error: 'Failed to delete flashcard' }, { status: 500 });
  }
}