import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// DELETE /api/upload/image/cleanup - Delete unused uploaded image (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Only delete files from our uploads directory
    if (!imageUrl.startsWith('/uploads/')) {
      return NextResponse.json(
        { error: 'Can only delete uploaded files' },
        { status: 400 }
      );
    }

    // Build the file path
    const filePath = join(process.cwd(), 'public', imageUrl);

    // Check if file exists and delete it
    if (existsSync(filePath)) {
      await unlink(filePath);
      console.log('Deleted unused image:', filePath);
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}