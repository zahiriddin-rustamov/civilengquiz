import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { User, DailyRankSnapshot } from '@/models/database';

// GET /api/leaderboard - Get leaderboard data with rank changes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    await connectToDatabase();

    // Get current user ID if authenticated
    const currentUserId = session?.user?.id;

    // Get current leaderboard (all students, sorted by totalXP)
    const leaderboardUsers = await User.find(
      { role: 'student' },
      {
        name: 1,
        totalXP: 1,
        level: 1,
        currentStreak: 1,
        learningStreak: 1,
        dailyRankHistory: { $slice: -1 }
      }
    )
    .sort({ totalXP: -1, _id: 1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();

    // Get yesterday's rank snapshot to calculate rank changes
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdaySnapshot = await DailyRankSnapshot.findOne(
      { date: yesterday },
      { rankings: 1 }
    ).lean();

    // Create a map of previous ranks for quick lookup
    const previousRanks = new Map();
    if (yesterdaySnapshot?.rankings) {
      yesterdaySnapshot.rankings.forEach((entry) => {
        previousRanks.set(entry.userId.toString(), entry.rank);
      });
    }

    // Process leaderboard data with rank changes
    const leaderboardData = leaderboardUsers.map((user, index) => {
      const currentRank = index + 1; // Simple sequential ranking based on XP order
      const previousRank = previousRanks.get(user._id.toString());
      const isCurrentUser = currentUserId === user._id.toString();

      let rankChange = 0;
      let rankChangeType: 'up' | 'down' | 'none' | 'new' = 'none';

      if (previousRank === undefined) {
        // New to leaderboard
        rankChangeType = 'new';
      } else if (previousRank > currentRank) {
        // Moved up (lower rank number is better)
        rankChange = previousRank - currentRank;
        rankChangeType = 'up';
      } else if (previousRank < currentRank) {
        // Moved down
        rankChange = currentRank - previousRank;
        rankChangeType = 'down';
      }

      return {
        userId: user._id,
        rank: currentRank,
        name: user.name,
        displayName: formatDisplayName(user.name),
        totalXP: user.totalXP,
        level: user.level,
        currentStreak: user.currentStreak,
        learningStreak: user.learningStreak,
        rankChange,
        rankChangeType,
        isCurrentUser
      };
    });

    // If current user is authenticated but not in top results, find their position
    let currentUserRank = null;
    if (currentUserId && !leaderboardData.some(user => user.isCurrentUser)) {
      const currentUser = await User.findById(currentUserId, {
        name: 1,
        totalXP: 1,
        level: 1,
        currentStreak: 1,
        learningStreak: 1
      }).lean();

      if (currentUser) {
        // Count users with higher XP to determine rank
        const userTotalXP = currentUser.totalXP;

        const higherXPCount = await User.countDocuments({
          role: 'student',
          totalXP: { $gt: userTotalXP }
        });

        const userRank = higherXPCount + 1;
        const previousRank = previousRanks.get(currentUserId);

        let rankChange = 0;
        let rankChangeType: 'up' | 'down' | 'none' | 'new' = 'none';

        if (previousRank === undefined) {
          rankChangeType = 'new';
        } else if (previousRank > userRank) {
          rankChange = previousRank - userRank;
          rankChangeType = 'up';
        } else if (previousRank < userRank) {
          rankChange = userRank - previousRank;
          rankChangeType = 'down';
        }

        currentUserRank = {
          userId: currentUser._id,
          rank: userRank,
          name: currentUser.name,
          displayName: formatDisplayName(currentUser.name),
          totalXP: currentUser.totalXP,
          level: currentUser.level,
          currentStreak: currentUser.currentStreak,
          learningStreak: currentUser.learningStreak,
          rankChange,
          rankChangeType,
          isCurrentUser: true
        };
      }
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments({
      role: 'student'
    });

    return NextResponse.json({
      success: true,
      leaderboard: leaderboardData,
      currentUserRank,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page * limit < totalUsers,
        hasPreviousPage: page > 1
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}

// Helper function to format display name for privacy
function formatDisplayName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return parts[0]; // Just first name if only one name
  }

  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();

  return `${firstName} ${lastInitial}.`;
}