import { NextRequest } from 'next/server';
import { hash } from 'bcrypt';
import clientPromise from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/utils/api';

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

    // Check if email is already registered
    const client = await clientPromise;
    const db = client.db();
    const existingUser = await db.collection('users').findOne({ email });

    if (existingUser) {
      return errorResponse('Email already registered', 409);
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create new user
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      role: 'student', // Default role
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return successResponse(
      {
        id: result.insertedId.toString(),
        name,
        email,
      },
      'User registered successfully'
    );
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Internal server error', 500);
  }
} 