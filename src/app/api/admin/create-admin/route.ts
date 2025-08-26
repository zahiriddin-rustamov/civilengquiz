import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongoose';
import { User } from '@/models/database';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Update existing user to admin
      const hashedPassword = await bcrypt.hash(password, 12);
      existingUser.role = 'admin';
      existingUser.password = hashedPassword;
      existingUser.isVerified = true;
      await existingUser.save();
      
      return NextResponse.json({
        message: 'User updated to admin successfully',
        user: { id: existingUser._id, email: existingUser.email, name: existingUser.name, role: existingUser.role }
      });
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      level: 1,
      totalXP: 0,
      currentStreak: 0,
      maxStreak: 0,
      achievements: []
    });

    await adminUser.save();

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: { id: adminUser._id, email: adminUser.email, name: adminUser.name, role: adminUser.role }
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}