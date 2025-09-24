import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { QuestionSection } from '@/models/database';

// POST /api/sections/reorder - Reorder sections within a topic (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { topicId, sectionOrders } = await request.json();

    if (!topicId || !Array.isArray(sectionOrders)) {
      return NextResponse.json(
        { error: 'Missing required fields: topicId and sectionOrders array' },
        { status: 400 }
      );
    }

    // Validate that all sections belong to the topic
    const sectionIds = sectionOrders.map(item => item.id);
    const sections = await QuestionSection.find({
      _id: { $in: sectionIds },
      topicId: topicId
    });

    if (sections.length !== sectionIds.length) {
      return NextResponse.json(
        { error: 'Some sections do not belong to the specified topic' },
        { status: 400 }
      );
    }

    // Update the order for each section
    const updatePromises = sectionOrders.map(({ id, order }) =>
      QuestionSection.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    // Return updated sections in order
    const updatedSections = await QuestionSection.find({ topicId })
      .sort({ order: 1 });

    return NextResponse.json(updatedSections);
  } catch (error) {
    console.error('Error reordering sections:', error);
    return NextResponse.json(
      { error: 'Failed to reorder sections' },
      { status: 500 }
    );
  }
}