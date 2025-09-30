import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { User, UserProgress, SessionTracking, UserInteraction, MediaEngagement, SurveyResponse } from '@/models/database';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id: userId } = await params;

    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Fetch user (exclude sensitive fields)
    const user = await User.findById(userId)
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get detailed progress statistics
    const progressStats = await UserProgress.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$contentType',
          totalCompleted: { $sum: { $cond: ['$completed', 1, 0] } },
          totalAttempts: { $sum: '$attempts' },
          totalXPEarned: { $sum: '$totalXPEarned' },
          totalTimeSpent: { $sum: '$timeSpent' }
        }
      }
    ]);

    // Get subject-wise progress
    const subjectProgress = await UserProgress.aggregate([
      { $match: { userId: new Types.ObjectId(userId), subjectId: { $exists: true } } },
      {
        $group: {
          _id: '$subjectId',
          totalCompleted: { $sum: { $cond: ['$completed', 1, 0] } },
          totalAttempts: { $sum: '$attempts' },
          averageScore: { $avg: '$score' }
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject'
        }
      },
      { $unwind: '$subject' }
    ]);

    // Get recent sessions
    const recentSessions = await SessionTracking.find({ userId: new Types.ObjectId(userId) })
      .sort({ startTime: -1 })
      .limit(10)
      .lean();

    // Get recent interactions
    const recentInteractions = await UserInteraction.find({ userId: new Types.ObjectId(userId) })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    // Calculate engagement metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await SessionTracking.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          startTime: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalActiveDuration: { $sum: '$activeDuration' }
        }
      }
    ]);

    return NextResponse.json({
      user,
      stats: {
        progressByType: progressStats,
        progressBySubject: subjectProgress,
        recentActivity: recentActivity[0] || {
          totalSessions: 0,
          totalDuration: 0,
          totalActiveDuration: 0
        }
      },
      recentSessions,
      recentInteractions
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id: userId } = await params;

    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, role, isVerified, password } = body;

    // Build update object
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined && ['student', 'admin'].includes(role)) updateData.role = role;
    if (isVerified !== undefined) updateData.isVerified = Boolean(isVerified);

    // Hash password if provided
    if (password && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use by another user' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id: userId } = await params;

    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Prevent self-deletion
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete associated data
    await Promise.all([
      UserProgress.deleteMany({ userId: new Types.ObjectId(userId) }),
      SessionTracking.deleteMany({ userId: new Types.ObjectId(userId) }),
      UserInteraction.deleteMany({ userId: new Types.ObjectId(userId) }),
      MediaEngagement.deleteMany({ userId: new Types.ObjectId(userId) }),
      SurveyResponse.deleteMany({ userId: new Types.ObjectId(userId) }),
    ]);

    // Delete user
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: 'User and all associated data deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}