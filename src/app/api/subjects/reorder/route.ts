import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Subject } from '@/models/database';
import connectToDatabase from '@/lib/mongoose';

// PUT /api/subjects/reorder - Bulk update subject order (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { subjectIds } = await request.json();

    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid subjectIds array' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Update order for each subject in a transaction-like batch
    const updatePromises = subjectIds.map(async (subjectId: string, index: number) => {
      return Subject.findByIdAndUpdate(
        subjectId,
        { order: index + 1 },
        { new: true }
      );
    });

    const updatedSubjects = await Promise.all(updatePromises);

    // Filter out any null results (subjects that weren't found)
    const validSubjects = updatedSubjects.filter(subject => subject !== null);

    if (validSubjects.length !== subjectIds.length) {
      return NextResponse.json(
        { error: 'Some subjects were not found' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Subject order updated successfully',
      subjects: validSubjects
    });

  } catch (error) {
    console.error('Error reordering subjects:', error);
    return NextResponse.json(
      { error: 'Failed to reorder subjects' },
      { status: 500 }
    );
  }
}