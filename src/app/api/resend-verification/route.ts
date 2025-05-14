import { NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/utils/api';
import { generateVerificationToken, sendVerificationEmail } from '@/utils/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return errorResponse('Email is required', 400);
    }

    // Validate UAEU student email
    const uaeuEmailRegex = /^\d+@uaeu\.ac\.ae$/;
    if (!uaeuEmailRegex.test(email)) {
      return errorResponse('Invalid email format', 400);
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Find user
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return successResponse(
        { email },
        'If your email is registered, a verification link has been sent.'
      );
    }

    // Check if already verified
    if (user.isVerified === true) {
      return successResponse(
        { email },
        'Your email is already verified. You can now log in to your account.'
      );
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours
    
    // Update user with new token
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: {
          verificationToken,
          verificationExpires: tokenExpiry,
          updatedAt: new Date(),
        } 
      }
    );
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, user.name, verificationToken);

    if (!emailSent) {
      return errorResponse('Failed to send verification email. Please try again later.', 500);
    }

    return successResponse(
      { email },
      'Verification email has been sent. Please check your inbox.'
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return errorResponse('Internal server error', 500);
  }
} 