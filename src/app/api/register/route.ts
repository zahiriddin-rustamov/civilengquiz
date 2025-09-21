import { NextRequest } from 'next/server';
import { hash } from 'bcrypt';
import clientPromise from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/utils/api';
import { generateVerificationToken, sendVerificationEmail, validateUAEUEmail } from '@/utils/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return errorResponse('Missing required fields', 400);
    }

    if (password.length < 8) {
      return errorResponse('Password must be at least 8 characters long', 400);
    }

    // Validate UAEU student email
    if (!validateUAEUEmail(email)) {
      return errorResponse('Only UAEU emails (e.g., username@uaeu.ac.ae) are allowed', 400);
    }

    // Check if email is already registered
    const client = await clientPromise;
    const db = client.db();
    const existingUser = await db.collection('users').findOne({ email });

    if (existingUser) {
      // If user exists but not verified, we can resend verification email
      if (existingUser.isVerified === false) {
        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours
        
        // Update the user with new token
        await db.collection('users').updateOne(
          { email },
          { 
            $set: {
              verificationToken,
              verificationExpires: tokenExpiry,
              updatedAt: new Date(),
            }
          }
        );
        
        // Send verification email
        await sendVerificationEmail(email, existingUser.name, verificationToken);
        
        return successResponse(
          { email },
          'Verification email resent. Please check your inbox.'
        );
      }
      
      return errorResponse('Email already registered', 409);
    }

    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours

    // Create new user
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      role: 'student', // Default role
      isVerified: false,
      verificationToken,
      verificationExpires: tokenExpiry,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, name, verificationToken);

    if (!emailSent) {
      // If email sending fails, still create the account but inform the user
      return successResponse(
        {
          id: result.insertedId.toString(),
          name,
          email,
        },
        'Account created, but we encountered an issue sending the verification email. Please contact support.'
      );
    }

    return successResponse(
      {
        id: result.insertedId.toString(),
        name,
        email,
      },
      'Registration successful! Please check your email to verify your account.'
    );
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Internal server error', 500);
  }
} 