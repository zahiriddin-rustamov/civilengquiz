import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SubjectService } from '@/lib/db-operations';

// GET /api/subjects - Get all subjects
export async function GET() {
  try {
    const subjects = await SubjectService.getAllSubjects();
    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

// POST /api/subjects - Create new subject (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    const { name, description, difficulty, estimatedHours, xpReward, order } = data;

    if (!name || !description || !difficulty || !estimatedHours || !xpReward || order === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, difficulty, estimatedHours, xpReward, order' },
        { status: 400 }
      );
    }

    const subject = await SubjectService.createSubject({
      name,
      description,
      imageUrl: data.imageUrl,
      isUnlocked: data.isUnlocked ?? true,
      order,
      difficulty,
      estimatedHours,
      xpReward,
      prerequisiteId: data.prerequisiteId
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}
