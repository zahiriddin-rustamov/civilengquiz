import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Question, Topic } from '@/models/database';
import { Types } from 'mongoose';

// PUT /api/admin/questions/reorder - Batch update question order
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { topicId, updates } = body;

    // Validate required fields
    if (!topicId || !updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Missing required fields: topicId, updates' }, { status: 400 });
    }

    // Validate topic exists
    if (!Types.ObjectId.isValid(topicId)) {
      return NextResponse.json({ error: 'Invalid topic ID' }, { status: 400 });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Validate all updates have required fields
    for (const update of updates) {
      if (!update.questionId || update.order === undefined) {
        return NextResponse.json({ error: 'Each update must have questionId and order' }, { status: 400 });
      }

      if (!Types.ObjectId.isValid(update.questionId)) {
        return NextResponse.json({ error: 'Invalid question ID in updates' }, { status: 400 });
      }
    }

    // Verify all questions belong to the specified topic
    const questionIds = updates.map((update: any) => new Types.ObjectId(update.questionId));
    const questions = await Question.find({
      _id: { $in: questionIds },
      topicId: new Types.ObjectId(topicId)
    });

    if (questions.length !== updates.length) {
      return NextResponse.json({
        error: 'Some questions not found or do not belong to this topic'
      }, { status: 400 });
    }

    // Perform bulk update
    const bulkOps = updates.map((update: any) => ({
      updateOne: {
        filter: {
          _id: new Types.ObjectId(update.questionId),
          topicId: new Types.ObjectId(topicId)
        },
        update: { order: update.order }
      }
    }));

    const result = await Question.bulkWrite(bulkOps);

    return NextResponse.json({
      message: 'Question order updated successfully',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error updating question order:', error);
    return NextResponse.json({ error: 'Failed to update question order' }, { status: 500 });
  }
}