import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { QuestionSection, Question } from '@/models/database';
import { Types } from 'mongoose';

// GET /api/sections - Get all sections (optionally filtered by topicId)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    let query = {};
    if (topicId) {
      query = { topicId: new Types.ObjectId(topicId) };
    }

    const sections = await QuestionSection.find(query)
      .populate('topicId', 'name')
      .sort({ order: 1 });

    // Get question counts for each section
    const sectionsWithCounts = await Promise.all(
      sections.map(async (section) => {
        const questionCount = await Question.countDocuments({
          sectionId: section._id
        });

        return {
          ...section.toObject(),
          questionCount
        };
      })
    );

    return NextResponse.json(sectionsWithCounts);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

// POST /api/sections - Create new section (Admin only)
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

    const data = await request.json();

    // Validate required fields
    const { name, topicId, settings } = data;

    if (!name || !topicId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, topicId' },
        { status: 400 }
      );
    }

    // Get the next order number for this topic
    const lastSection = await QuestionSection.findOne({ topicId })
      .sort({ order: -1 });

    const order = (lastSection?.order || 0) + 1;

    // Create default settings if not provided
    const defaultSettings = {
      unlockConditions: 'always',
      allowRandomAccess: true,
      showToStudents: 'always',
      requireCompletion: false,
      ...settings
    };

    const section = await QuestionSection.create({
      name,
      description: data.description,
      topicId,
      order,
      settings: defaultSettings
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
}