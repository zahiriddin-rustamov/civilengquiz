import connectToDatabase from './mongoose';
import { User, UserProgress, Subject, Topic, Question, Flashcard, Media } from '@/models/database';
import { ACHIEVEMENTS, checkAchievements, UserStats, Achievement } from './achievements';
import { Types } from 'mongoose';

export class XPService {
  /**
   * Check if user is eligible for daily XP (content completed on different day)
   */
  static isDailyXPEligible(firstCompletedDate: Date | undefined, lastDailyXPDate: Date | undefined): boolean {
    if (!firstCompletedDate) {
      // Content never completed before
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstCompleted = new Date(firstCompletedDate);
    firstCompleted.setHours(0, 0, 0, 0);

    // Check if it's a different day from first completion
    if (today.getTime() <= firstCompleted.getTime()) {
      // Same day as first completion or somehow in the past
      return false;
    }

    // If daily XP was already awarded today, not eligible
    if (lastDailyXPDate) {
      const lastDaily = new Date(lastDailyXPDate);
      lastDaily.setHours(0, 0, 0, 0);

      if (today.getTime() === lastDaily.getTime()) {
        // Already got daily XP today
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate daily XP (50% of base XP)
   */
  static calculateDailyXP(
    contentType: 'question' | 'flashcard' | 'media' | 'section',
    score?: number,
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced',
    additionalData?: any
  ): number {
    // Get base XP
    const baseXP = this.calculateContentXP(contentType, score, difficulty, additionalData);

    // Return 50% of base XP for daily reward
    return Math.round(baseXP * 0.5);
  }

  /**
   * Calculate and update user XP and level
   */
  static async updateUserXP(userId: string, xpGained: number): Promise<{
    newLevel: number;
    totalXP: number;
    leveledUp: boolean;
    newAchievements: Achievement[];
  }> {
    await connectToDatabase();
    
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const oldLevel = user.level || 1;
    const oldXP = user.totalXP || 0;
    const newTotalXP = oldXP + xpGained;
    
    // Calculate new level (100 XP per level)
    const newLevel = Math.floor(newTotalXP / 100) + 1;
    const leveledUp = newLevel > oldLevel;

    // Update user XP and level
    user.totalXP = newTotalXP;
    user.level = newLevel;
    
    // Update last active date for streak calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (lastActive) {
      lastActive.setHours(0, 0, 0, 0);
    }

    // Calculate streak
    if (!lastActive) {
      // First time user
      user.currentStreak = 1;
      user.maxStreak = 1;
    } else {
      const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day, maintain streak
        // Don't change streak
      } else if (daysDiff === 1) {
        // Next day, continue streak
        user.currentStreak = (user.currentStreak || 0) + 1;
        user.maxStreak = Math.max(user.maxStreak || 0, user.currentStreak);
      } else {
        // Streak broken
        user.currentStreak = 1;
      }
    }
    
    user.lastActiveDate = new Date();

    // Check for new achievements
    const userStats = await this.getUserStats(userId);
    const currentAchievements = user.achievements || [];
    const newAchievements = checkAchievements(userStats, currentAchievements);
    
    // Add new achievements and their XP
    if (newAchievements.length > 0) {
      const achievementIds = newAchievements.map(a => a.id);
      user.achievements = [...currentAchievements, ...achievementIds];
      
      // Add achievement XP
      const achievementXP = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
      user.totalXP += achievementXP;
      
      // Recalculate level with achievement XP
      const finalLevel = Math.floor(user.totalXP / 100) + 1;
      user.level = finalLevel;
    }

    await user.save();

    return {
      newLevel: user.level,
      totalXP: user.totalXP,
      leveledUp: user.level > oldLevel,
      newAchievements
    };
  }

  /**
   * Get comprehensive user statistics for achievement checking
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    await connectToDatabase();
    
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all user progress records
    const progressRecords = await UserProgress.find({ userId }).lean();
    
    // Calculate statistics
    const totalQuizzesCompleted = progressRecords.filter(
      p => p.contentType === 'quiz' && p.completed
    ).length;
    
    const totalFlashcardsCompleted = progressRecords.filter(
      p => p.contentType === 'flashcard' && p.completed
    ).length;
    
    const totalMediaCompleted = progressRecords.filter(
      p => p.contentType === 'media' && p.completed
    ).length;

    // Calculate average score from completed question attempts using best scores
    const questionAttempts = progressRecords.filter(p =>
      p.contentType === 'question' && p.completed && (p.bestScore !== undefined || p.score !== undefined)
    );
    const averageScore = questionAttempts.length > 0
      ? Math.round(questionAttempts.reduce((sum, p) => sum + (p.bestScore || p.score || 0), 0) / questionAttempts.length)
      : 0;

    // Count perfect scores (90%+ on questions) using best scores
    const perfectScores = questionAttempts.filter(p => (p.bestScore || p.score || 0) >= 90).length;

    // Get subjects and topics completed
    const subjects = await Subject.find({}).lean();
    let subjectsCompleted = 0;
    let topicsCompleted = 0;

    for (const subject of subjects) {
      const topics = await Topic.find({ subjectId: subject._id }).lean();
      let subjectTopicsCompleted = 0;

      for (const topic of topics) {
        // Get all content for this topic
        const [questions, flashcards, media] = await Promise.all([
          Question.find({ topicId: topic._id }).lean(),
          Flashcard.find({ topicId: topic._id }).lean(),
          Media.find({ topicId: topic._id }).lean()
        ]);

        const totalTopicItems = questions.length + flashcards.length + media.length;
        
        if (totalTopicItems > 0) {
          const completedTopicItems = progressRecords.filter(
            p => p.topicId?.toString() === topic._id.toString() && p.completed
          ).length;

          // Consider topic completed if 80% or more items are done
          if (completedTopicItems / totalTopicItems >= 0.8) {
            subjectTopicsCompleted++;
            topicsCompleted++;
          }
        }
      }

      // Consider subject completed if 80% or more topics are done
      if (topics.length > 0 && subjectTopicsCompleted / topics.length >= 0.8) {
        subjectsCompleted++;
      }
    }

    // Calculate study days (unique days with activity)
    const uniqueDates = new Set(
      progressRecords.map(p => p.lastAccessed.toISOString().split('T')[0])
    );
    const studyDays = uniqueDates.size;

    return {
      totalXP: user.totalXP || 0,
      level: user.level || 1,
      totalQuizzesCompleted,
      totalFlashcardsCompleted,
      totalMediaCompleted,
      averageScore,
      currentStreak: user.currentStreak || 0,
      maxStreak: user.maxStreak || 0,
      subjectsCompleted,
      topicsCompleted,
      perfectScores,
      studyDays
    };
  }

  /**
   * Get user achievements with details
   */
  static async getUserAchievements(userId: string): Promise<{
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlockedAt: Date;
  }[]> {
    await connectToDatabase();
    
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const userAchievementIds = user.achievements || [];
    const achievements = ACHIEVEMENTS.filter(a => userAchievementIds.includes(a.id));

    return achievements.map(achievement => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      rarity: achievement.rarity,
      unlockedAt: user.updatedAt // Approximation - in production, you'd track individual unlock dates
    }));
  }

  /**
   * Calculate XP for completing content
   */
  static calculateContentXP(
    contentType: 'question' | 'flashcard' | 'media' | 'section',
    score?: number,
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced',
    additionalData?: any
  ): number {
    let baseXP = 0;

    switch (contentType) {
      case 'question':
        baseXP = score || 0; // XP equals the score earned
        break;
      case 'flashcard':
        baseXP = 20; // Base XP for flashcard
        if (additionalData?.masteryLevel === 'Mastered') {
          baseXP += 10; // Bonus for mastering
        }
        break;
      case 'media':
        baseXP = 50; // Base XP for media completion
        break;
      case 'section':
        baseXP = 100; // Base XP for section completion bonus
        break;
    }

    // Difficulty multiplier
    const difficultyMultiplier = {
      'Beginner': 1.0,
      'Intermediate': 1.2,
      'Advanced': 1.5
    }[difficulty || 'Beginner'];

    return Math.round(baseXP * difficultyMultiplier);
  }

  /**
   * Calculate completion bonus XP
   */
  static calculateCompletionBonus(type: 'section' | 'flashcard-topic' | 'media-topic', difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'): number {
    let bonusXP = 0;

    switch (type) {
      case 'section':
        bonusXP = 100; // Bonus for completing all questions in a section
        break;
      case 'flashcard-topic':
        bonusXP = 150; // Bonus for studying all flashcards in a topic
        break;
      case 'media-topic':
        bonusXP = 200; // Bonus for watching all media in a topic
        break;
    }

    // Apply difficulty multiplier
    const difficultyMultiplier = {
      'Beginner': 1.0,
      'Intermediate': 1.2,
      'Advanced': 1.5
    }[difficulty || 'Beginner'];

    return Math.round(bonusXP * difficultyMultiplier);
  }
}
