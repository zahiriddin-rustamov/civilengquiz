import { NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/utils/api';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    if (!token) {
      return errorResponse('Invalid verification token', 400);
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Find user with this verification token
    const user = await db.collection('users').findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() } // Token not expired
    });

    if (!user) {
      return errorResponse('Invalid or expired verification token', 400);
    }

    // Mark user as verified and remove verification token
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          isVerified: true,
          updatedAt: new Date()
        },
        $unset: {
          verificationToken: 1,
          verificationExpires: 1
        }
      }
    );

    return successResponse(
      { email: user.email },
      'Email verification successful. You can now log in to your account.'
    );
  } catch (error) {
    console.error('Verification error:', error);
    return errorResponse('Internal server error', 500);
  }
} 