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
    const { topicId, sections } = body;

    // Validate required fields
    if (!topicId || !sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'Missing required fields: topicId, sections' }, { status: 400 });
    }

    // Validate topic exists
    if (!Types.ObjectId.isValid(topicId)) {
      return NextResponse.json({ error: 'Invalid topic ID' }, { status: 400 });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Flatten all question updates from all sections
    const allUpdates = [];

    for (const section of sections) {
      if (!section.sectionId || !section.questions || !Array.isArray(section.questions)) {
        return NextResponse.json({ error: 'Each section must have sectionId and questions array' }, { status: 400 });
      }

      for (const questionUpdate of section.questions) {
        if (!questionUpdate.questionId || questionUpdate.order === undefined || !questionUpdate.sectionId) {
          return NextResponse.json({ error: 'Each question update must have questionId, order, and sectionId' }, { status: 400 });
        }

        if (!Types.ObjectId.isValid(questionUpdate.questionId) || !Types.ObjectId.isValid(questionUpdate.sectionId)) {
          return NextResponse.json({ error: 'Invalid question ID or section ID in updates' }, { status: 400 });
        }

        allUpdates.push(questionUpdate);
      }
    }

    // Verify all questions belong to the specified topic
    const questionIds = allUpdates.map((update: any) => new Types.ObjectId(update.questionId));
    const questions = await Question.find({
      _id: { $in: questionIds },
      topicId: new Types.ObjectId(topicId)
    });

    if (questions.length !== allUpdates.length) {
      return NextResponse.json({
        error: 'Some questions not found or do not belong to this topic'
      }, { status: 400 });
    }

    // Perform bulk update (including potential section moves)
    const bulkOps = allUpdates.map((update: any) => ({
      updateOne: {
        filter: {
          _id: new Types.ObjectId(update.questionId),
          topicId: new Types.ObjectId(topicId)
        },
        update: {
          order: update.order,
          sectionId: new Types.ObjectId(update.sectionId)
        }
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