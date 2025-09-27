import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SectionService } from '@/lib/db-operations';
import connectToDatabase from '@/lib/mongoose';
import { QuestionSection, Question } from '@/models/database';

// GET /api/sections/[id] - Get section by ID
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

    await connectToDatabase();

    const { id } = await params;
    const section = await QuestionSection.findById(id)
      .populate('topicId', 'name subjectId');

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Get question count
    const questionCount = await Question.countDocuments({
      sectionId: section._id
    });

    const response = {
      ...section.toObject(),
      questionCount
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching section:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section' },
      { status: 500 }
    );
  }
}

// PUT /api/sections/[id] - Update section (Admin only)
export async function PUT(
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

    await connectToDatabase();

    const { id } = await params;
    const data = await request.json();

    const section = await QuestionSection.findById(id);

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (data.name !== undefined) section.name = data.name;
    if (data.description !== undefined) section.description = data.description;
    if (data.order !== undefined) section.order = data.order;
    if (data.settings !== undefined) {
      section.settings = { ...section.settings, ...data.settings };
    }

    await section.save();

    return NextResponse.json(section);
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[id] - Delete section (Admin only)
export async function DELETE(
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

    const deleted = await SectionService.deleteSection(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}