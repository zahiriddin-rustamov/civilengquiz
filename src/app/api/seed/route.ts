import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { seedDatabase, isDatabaseEmpty } from '@/lib/seed-database';

// POST /api/seed - Seed the database with initial data (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow seeding only for admins or if database is empty (for initial setup)
    const dbEmpty = await isDatabaseEmpty();
    
    if (!dbEmpty && (!session || (session.user as any).role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required or database must be empty.' },
        { status: 403 }
      );
    }

    const result = await seedDatabase();
    
    if (result.success) {
      return NextResponse.json({
        message: result.message,
        success: true
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}

// GET /api/seed - Check if database needs seeding
export async function GET() {
  try {
    const isEmpty = await isDatabaseEmpty();
    return NextResponse.json({
      isEmpty,
      needsSeeding: isEmpty,
      message: isEmpty ? 'Database is empty and can be seeded' : 'Database already contains data'
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json(
      { error: 'Failed to check database status' },
      { status: 500 }
    );
  }
}
