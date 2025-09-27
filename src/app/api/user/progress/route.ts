import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { ProgressService, SubjectService, TopicService, QuestionService, FlashcardService, MediaService } from '@/lib/db-operations';
import { XPService } from '@/lib/xp-service';
import { initializeUserGamingFields } from '@/lib/user-migration';

// GET /api/user/progress - Get comprehensive user progress or topic-specific progress
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

    // Check if this is a topic-specific request
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    // If topicId is provided, return topic-specific progress
    if (topicId) {
      await connectToDatabase();

      const topicProgress = await ProgressService.getUserTopicProgress(userId, topicId);

      // Get all media items for this topic to find their IDs
      const mediaItems = await MediaService.getMediaByTopic(topicId);
      const mediaIds = mediaItems.map(item => item._id.toString());

      // Get user progress for all media items in this topic
      const { UserProgress } = await import('@/models/database');
      const mediaProgress = await UserProgress.find({
        userId,
        contentId: { $in: mediaIds },
        contentType: 'media'
      }).lean();

      // Create a map of media items for reference
      const mediaItemsMap = new Map();
      for (const item of mediaItems) {
        mediaItemsMap.set(item._id.toString(), item);
      }

      // Transform media progress to match frontend format
      const videoProgress: Record<string, { progress: number; completed: boolean; points: number }> = {};
      const shortProgress: Record<string, { completed: boolean; points: number; watchCount: number }> = {};

      for (const progress of mediaProgress) {
        const contentId = progress.contentId.toString();
        const mediaItem = mediaItemsMap.get(contentId);

        if (!mediaItem) continue;

        if (mediaItem.videoType === 'short') {
          shortProgress[contentId] = {
            completed: progress.completed,
            points: progress.completed ? mediaItem.xpReward : 0,
            watchCount: progress.attempts || 1
          };
        } else if (mediaItem.videoType === 'video') {
          // Long-form video
          videoProgress[contentId] = {
            progress: progress.score || 0,
            completed: progress.completed,
            points: progress.completed ? mediaItem.xpReward : Math.round((progress.score || 0) * mediaItem.xpReward)
          };
        } else {
          // Unknown video type, log for debugging
          console.warn(`Unknown video type: ${mediaItem.videoType} for media ${contentId}`);
        }
      }

      // Debug logging
      console.log('Progress API Debug:', {
        topicId,
        mediaItemsCount: mediaItems.length,
        mediaProgressCount: mediaProgress.length,
        videoProgressKeys: Object.keys(videoProgress),
        shortProgressKeys: Object.keys(shortProgress),
        finalVideoProgress: videoProgress,
        finalShortProgress: shortProgress,
        mediaItemsMap: Array.from(mediaItemsMap.entries()).map(([id, item]) => ({
          id,
          videoType: item.videoType,
          title: item.title
        })),
        progressEntries: mediaProgress.map(p => ({
          contentId: p.contentId.toString(),
          completed: p.completed,
          videoType: p.data?.videoType,
          score: p.score
        }))
      });

      return NextResponse.json({
        topicProgress,
        videoProgress,
        shortProgress,
        totalQuizCorrect: 0, // TODO: Add quiz progress if needed
        currentStreak: 0, // TODO: Add streak calculation if needed
        shortsWatchedToday: 0 // TODO: Add daily stats if needed
      });
    }

    // Initialize gaming fields if they don't exist
    await initializeUserGamingFields(userId);

    // Get all subjects to calculate progress
    const subjects = await SubjectService.getAllSubjects();
    
    let totalXP = 0;
    let totalQuizzesCompleted = 0;
    let totalCorrectAnswers = 0;
    let totalAnswers = 0;
    
    const subjectProgress = [];

    for (const subject of subjects) {
      const subjectProgressData = await ProgressService.getUserSubjectProgress(userId, subject._id.toString());
      const topics = await TopicService.getTopicsBySubject(subject._id.toString());
      
      const topicProgress = [];
      
      for (const topic of topics) {
        const topicProgressData = await ProgressService.getUserTopicProgress(userId, topic._id.toString());
        
        // Get actual content counts for this topic
        const [questions, flashcards, media] = await Promise.all([
          QuestionService.getQuestionsByTopic(topic._id.toString()),
          FlashcardService.getFlashcardsByTopic(topic._id.toString()),
          MediaService.getMediaByTopic(topic._id.toString())
        ]);
        
        topicProgress.push({
          id: topic._id.toString(),
          name: topic.name,
          isCompleted: topicProgressData.progressPercentage >= 80,
          isUnlocked: topic.isUnlocked,
          bestScore: topicProgressData.progressPercentage,
          attemptsCount: topicProgressData.completedItems,
          contentTypes: {
            questions: questions.length,
            flashcards: flashcards.length,
            media: media.length
          }
        });
        
        totalXP += topicProgressData.earnedXP;
        totalQuizzesCompleted += topicProgressData.completedItems;
      }
      
      subjectProgress.push({
        id: subject._id.toString(),
        name: subject.name,
        description: subject.description,
        icon: getSubjectIcon(subject.name),
        totalTopics: topics.length,
        completedTopics: subjectProgressData.completedTopics,
        averageScore: subjectProgressData.progressPercentage,
        isUnlocked: subject.isUnlocked,
        topics: topicProgress
      });
    }

    // Get user stats and achievements from XP service
    const userStats = await XPService.getUserStats(userId);
    const badges = await XPService.getUserAchievements(userId);

    const progress = {
      level: userStats.level,
      xp: userStats.totalXP,
      xpToNextLevel: Math.max(0, (userStats.level * 100) - userStats.totalXP),
      currentStreak: userStats.currentStreak,
      totalQuizzesCompleted: userStats.totalQuizzesCompleted,
      averageScore: userStats.averageScore,
      badges,
      subjectProgress
    };

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// Helper function to get subject icons
function getSubjectIcon(subjectName: string): string {
  switch (subjectName) {
    case 'Concrete Technology':
      return '🧱';
    case 'Environmental Engineering':
      return '🌍';
    case 'Water Resources':
      return '🌊';
    case 'Structural Analysis':
      return '🏗️';
    case 'Soil Mechanics':
      return '⛰️';
    case 'Fluid Mechanics':
      return '💧';
    default:
      return '📚';
  }
}
