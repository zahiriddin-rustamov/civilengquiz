import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ProgressService, SubjectService, TopicService, QuestionService, FlashcardService, MediaService } from '@/lib/db-operations';
import { XPService } from '@/lib/xp-service';
import { initializeUserGamingFields } from '@/lib/user-migration';

// GET /api/user/progress - Get comprehensive user progress
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
