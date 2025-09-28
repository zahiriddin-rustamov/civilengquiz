import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { UserProgress, Topic, Subject } from '@/models/database';

// GET /api/user/recent-activity - Get user's most recent learning activity
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    await connectToDatabase();

    // Get the most recent activity
    const recentProgress = await UserProgress
      .findOne({ userId })
      .sort({ lastAccessed: -1 })
      .lean();

    if (!recentProgress) {
      return NextResponse.json({
        lastActivity: null,
        message: 'No recent activity found'
      });
    }

    // Get topic and subject names for better context
    let topicName = '';
    let subjectName = '';

    if (recentProgress.topicId) {
      const topic = await Topic.findById(recentProgress.topicId).lean();
      if (topic) {
        topicName = topic.name;

        if (topic.subjectId) {
          const subject = await Subject.findById(topic.subjectId).lean();
          if (subject) {
            subjectName = subject.name;
          }
        }
      }
    }

    // Get recent incomplete activities (up to 5)
    const incompleteActivities = await UserProgress
      .find({
        userId,
        completed: false
      })
      .sort({ lastAccessed: -1 })
      .limit(5)
      .lean();

    // Calculate suggestions based on progress patterns
    const suggestions = [];

    // Find topics that are almost complete (80-99%)
    const nearCompleteTopics = await UserProgress.aggregate([
      {
        $match: {
          userId,
          contentType: { $in: ['question', 'flashcard', 'media'] }
        }
      },
      {
        $group: {
          _id: '$topicId',
          avgScore: { $avg: '$score' },
          completedCount: {
            $sum: { $cond: ['$completed', 1, 0] }
          },
          totalCount: { $sum: 1 }
        }
      },
      {
        $match: {
          avgScore: { $gte: 80, $lt: 100 }
        }
      },
      {
        $limit: 3
      }
    ]);

    for (const nearComplete of nearCompleteTopics) {
      if (nearComplete._id) {
        const topic = await Topic.findById(nearComplete._id).lean();
        if (topic) {
          suggestions.push({
            type: 'near-complete',
            topicId: topic._id.toString(),
            topicName: topic.name,
            progress: nearComplete.avgScore,
            message: `Almost done with ${topic.name}! (${Math.round(nearComplete.avgScore)}%)`
          });
        }
      }
    }

    return NextResponse.json({
      lastActivity: {
        contentType: recentProgress.contentType,
        contentId: recentProgress.contentId,
        topicId: recentProgress.topicId,
        subjectId: recentProgress.subjectId,
        sectionId: recentProgress.sectionId,
        lastAccessed: recentProgress.lastAccessed,
        completed: recentProgress.completed,
        score: recentProgress.score,
        topicName,
        subjectName
      },
      incompleteActivities: incompleteActivities.map(activity => ({
        contentType: activity.contentType,
        contentId: activity.contentId,
        topicId: activity.topicId,
        completed: activity.completed,
        score: activity.score,
        lastAccessed: activity.lastAccessed
      })),
      suggestions
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}