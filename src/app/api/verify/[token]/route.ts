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
      verificationToken: token
    });

    // If user not found, token is invalid
    if (!user) {
      return errorResponse('Invalid or expired verification token', 400);
    }

    // If user is already verified, return success message
    if (user.isVerified) {
      return successResponse(
        { email: user.email },
        'Your email is already verified. You can log in to your account.'
      );
    }

    // Check if token has expired
    if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
      return errorResponse('Verification token has expired. Please request a new one.', 400);
    }

    // Mark user as verified (keep token so we can recognize already-verified users)
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          isVerified: true,
          updatedAt: new Date()
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