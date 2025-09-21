import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// POST /api/upload/image - Upload image file (Admin only)
export async function POST(request: NextRequest) {
  try {
    console.log('Image upload API called');

    const session = await getServerSession(authOptions);
    console.log('Session check:', session ? 'authenticated' : 'not authenticated');

    if (!session || (session.user as any).role !== 'admin') {
      console.log('Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';

    console.log('File received:', file ? file.name : 'none', 'Folder:', folder);

    if (!file) {
      console.log('No file in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    console.log('File type:', file.type, 'Allowed types:', allowedTypes);

    if (!allowedTypes.includes(file.type)) {
      console.log('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    console.log('File size:', file.size, 'Max size:', maxSize);

    if (file.size > maxSize) {
      console.log('File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', folder);
    console.log('Upload directory:', uploadsDir);

    if (!existsSync(uploadsDir)) {
      console.log('Creating upload directory');
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${originalName}`;
    const filePath = join(uploadsDir, fileName);

    console.log('Generated filename:', fileName);
    console.log('Full file path:', filePath);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log('File saved successfully');

    // Return the public URL
    const publicUrl = `/uploads/${folder}/${fileName}`;
    console.log('Public URL:', publicUrl);

    return NextResponse.json({
      url: publicUrl,
      fileName,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}