import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { User, UserProgress, SessionTracking } from '@/models/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const verified = searchParams.get('verified');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build filter query
    const filter: any = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (verified && verified !== 'all') {
      filter.isVerified = verified === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Count total documents
    const total = await User.countDocuments(filter);

    // Fetch users with pagination
    const users = await User.find(filter)
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get additional stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const userId = user._id;

      // Get last active date from recent sessions
      const recentSession = await SessionTracking.findOne({ userId })
        .sort({ startTime: -1 })
        .select('startTime')
        .lean();

      // Get progress stats
      const progressStats = await UserProgress.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalCompleted: { $sum: { $cond: ['$completed', 1, 0] } },
            totalAttempts: { $sum: '$attempts' }
          }
        }
      ]);

      const stats = progressStats[0] || { totalCompleted: 0, totalAttempts: 0 };

      return {
        ...user,
        lastActiveDate: recentSession?.startTime || user.lastActiveDate,
        stats: {
          completedContent: stats.totalCompleted,
          totalAttempts: stats.totalAttempts
        }
      };
    }));

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { action, userIds } = body;

    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'Invalid request. Action and userIds array required.' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'bulk_verify':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { $set: { isVerified: true } }
        );
        break;

      case 'bulk_unverify':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { $set: { isVerified: false } }
        );
        break;

      case 'bulk_delete':
        // Also delete associated user data
        await UserProgress.deleteMany({ userId: { $in: userIds } });
        await SessionTracking.deleteMany({ userId: { $in: userIds } });
        result = await User.deleteMany({ _id: { $in: userIds } });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Bulk action '${action}' completed`,
      affected: result.modifiedCount || result.deletedCount || 0
    });

  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}