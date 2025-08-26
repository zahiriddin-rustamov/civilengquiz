import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { initializeUserGamingFields, bulkInitializeAllUsers } from '@/lib/user-migration';

// POST /api/user/initialize - Initialize gaming fields for current user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await initializeUserGamingFields(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Gaming fields initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing user gaming fields:', error);
    return NextResponse.json(
      { error: 'Failed to initialize gaming fields' },
      { status: 500 }
    );
  }
}

// PUT /api/user/initialize - Bulk initialize all users (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const result = await bulkInitializeAllUsers();

    return NextResponse.json({
      success: true,
      message: `Initialized ${result.initializedUsers} out of ${result.totalUsers} users`,
      ...result
    });
  } catch (error) {
    console.error('Error in bulk initialization:', error);
    return NextResponse.json(
      { error: 'Failed to bulk initialize users' },
      { status: 500 }
    );
  }
}
