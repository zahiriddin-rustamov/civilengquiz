import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { User, DailyRankSnapshot } from '@/models/database';

// POST /api/leaderboard/update-ranks - Calculate and store daily rank snapshots
export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key validation for security
    const apiKey = request.headers.get('x-api-key');
    if (process.env.CRON_SECRET && apiKey !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get current date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we already have a snapshot for today
    const existingSnapshot = await DailyRankSnapshot.findOne({ date: today });
    if (existingSnapshot) {
      return NextResponse.json({
        message: 'Rank snapshot already exists for today',
        date: today.toISOString()
      });
    }

    // Get all students for leaderboard
    const users = await User.find(
      {
        role: 'student'
      },
      {
        _id: 1,
        totalXP: 1,
        level: 1,
        currentStreak: 1,
        learningStreak: 1,
        dailyRankHistory: { $slice: -1 } // Get most recent rank entry
      }
    )
    .sort({ totalXP: -1 })
    .lean();

    // Get yesterday's snapshot to calculate rank changes
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdaySnapshot = await DailyRankSnapshot.findOne(
      { date: yesterday },
      { rankings: 1 }
    ).lean();

    // Create a map of previous ranks
    const previousRanks = new Map();
    if (yesterdaySnapshot?.rankings) {
      yesterdaySnapshot.rankings.forEach((entry) => {
        previousRanks.set(entry.userId.toString(), entry.rank);
      });
    }

    // Build today's rankings with rank changes
    const todayRankings = users.map((user, index) => {
      const currentRank = index + 1;
      const previousRank = previousRanks.get(user._id.toString());

      let rankChange = 0;
      if (previousRank !== undefined) {
        rankChange = previousRank - currentRank; // Positive = moved up, negative = moved down
      }

      return {
        userId: user._id,
        rank: currentRank,
        totalXP: user.totalXP,
        level: user.level,
        currentStreak: user.currentStreak || 0,
        learningStreak: user.learningStreak || 0,
        previousRank,
        rankChange
      };
    });

    // Create today's snapshot
    const snapshot = new DailyRankSnapshot({
      date: today,
      rankings: todayRankings
    });

    await snapshot.save();

    // Update individual user rank histories
    const bulkUserUpdates = todayRankings.map((ranking) => ({
      updateOne: {
        filter: { _id: ranking.userId },
        update: {
          $push: {
            dailyRankHistory: {
              $each: [{
                date: today,
                rank: ranking.rank,
                totalXP: ranking.totalXP
              }],
              $slice: -30 // Keep only last 30 days of rank history
            }
          }
        }
      }
    }));

    if (bulkUserUpdates.length > 0) {
      await User.bulkWrite(bulkUserUpdates);
    }

    // Clean up old snapshots (keep last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await DailyRankSnapshot.deleteMany({
      date: { $lt: thirtyDaysAgo }
    });

    return NextResponse.json({
      success: true,
      message: 'Daily rank snapshot created successfully',
      date: today.toISOString(),
      totalUsers: todayRankings.length,
      rankChanges: {
        improved: todayRankings.filter(r => r.rankChange > 0).length,
        declined: todayRankings.filter(r => r.rankChange < 0).length,
        unchanged: todayRankings.filter(r => r.rankChange === 0).length,
        new: todayRankings.filter(r => r.previousRank === undefined).length
      }
    });

  } catch (error) {
    console.error('Error updating daily ranks:', error);
    return NextResponse.json(
      { error: 'Failed to update daily ranks' },
      { status: 500 }
    );
  }
}

// GET /api/leaderboard/update-ranks - Get information about rank updates (for debugging)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get the most recent snapshot
    const latestSnapshot = await DailyRankSnapshot.findOne()
      .sort({ date: -1 })
      .lean();

    if (!latestSnapshot) {
      return NextResponse.json({
        message: 'No rank snapshots found',
        hasSnapshots: false
      });
    }

    // Calculate some stats
    const stats = {
      lastUpdateDate: latestSnapshot.date,
      totalUsers: latestSnapshot.rankings.length,
      rankChanges: {
        improved: latestSnapshot.rankings.filter(r => r.rankChange > 0).length,
        declined: latestSnapshot.rankings.filter(r => r.rankChange < 0).length,
        unchanged: latestSnapshot.rankings.filter(r => r.rankChange === 0).length,
        new: latestSnapshot.rankings.filter(r => r.previousRank === undefined).length
      }
    };

    return NextResponse.json({
      success: true,
      hasSnapshots: true,
      stats,
      latestSnapshot: {
        date: latestSnapshot.date,
        userCount: latestSnapshot.rankings.length
      }
    });

  } catch (error) {
    console.error('Error fetching rank update info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rank update information' },
      { status: 500 }
    );
  }
}