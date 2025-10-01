export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (userStats: UserStats) => boolean;
  xpReward: number;
}

export interface UserStats {
  totalXP: number;
  level: number;
  totalQuizzesCompleted: number;
  totalFlashcardsCompleted: number;
  totalMediaCompleted: number;
  totalSectionsCompleted: number;
  averageScore: number;
  currentStreak: number;
  maxStreak: number;
  subjectsCompleted: number;
  topicsCompleted: number;
  perfectScores: number;
  studyDays: number;
  // Question type counts
  multipleChoiceCorrect: number;
  trueFalseCorrect: number;
  fillInBlankCorrect: number;
  numericalCorrect: number;
  matchingCorrect: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Common Achievements (Bronze tier)
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first quiz',
    icon: '🎯',
    rarity: 'common',
    condition: (stats) => stats.totalQuizzesCompleted >= 1,
    xpReward: 50
  },
  {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: 'Complete 10 quizzes',
    icon: '📖',
    rarity: 'common',
    condition: (stats) => stats.totalQuizzesCompleted >= 10,
    xpReward: 100
  },
  {
    id: 'section_starter',
    name: 'Section Starter',
    description: 'Complete your first section',
    icon: '📝',
    rarity: 'common',
    condition: (stats) => stats.totalSectionsCompleted >= 1,
    xpReward: 50
  },
  {
    id: 'flashcard_novice',
    name: 'Flashcard Novice',
    description: 'Complete 25 flashcards',
    icon: '🃏',
    rarity: 'common',
    condition: (stats) => stats.totalFlashcardsCompleted >= 25,
    xpReward: 75
  },
  {
    id: 'media_explorer',
    name: 'Media Explorer',
    description: 'Complete 5 media items',
    icon: '🎬',
    rarity: 'common',
    condition: (stats) => stats.totalMediaCompleted >= 5,
    xpReward: 100
  },
  {
    id: 'level_up',
    name: 'Level Up!',
    description: 'Reach level 5',
    icon: '⬆️',
    rarity: 'common',
    condition: (stats) => stats.level >= 5,
    xpReward: 150
  },

  // Rare Achievements (Silver tier)
  {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Maintain a 3-day study streak',
    icon: '🔥',
    rarity: 'rare',
    condition: (stats) => stats.currentStreak >= 3,
    xpReward: 200
  },
  {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Complete 50 quizzes',
    icon: '💪',
    rarity: 'rare',
    condition: (stats) => stats.totalQuizzesCompleted >= 50,
    xpReward: 300
  },
  {
    id: 'high_achiever',
    name: 'High Achiever',
    description: 'Maintain an 80% average score',
    icon: '🎖️',
    rarity: 'rare',
    condition: (stats) => stats.averageScore >= 80,
    xpReward: 250
  },
  {
    id: 'topic_master',
    name: 'Topic Master',
    description: 'Complete 5 topics',
    icon: '🏆',
    rarity: 'rare',
    condition: (stats) => stats.topicsCompleted >= 5,
    xpReward: 400
  },
  {
    id: 'section_regular',
    name: 'Section Regular',
    description: 'Complete 10 sections',
    icon: '📚',
    rarity: 'rare',
    condition: (stats) => stats.totalSectionsCompleted >= 10,
    xpReward: 200
  },
  {
    id: 'multiple_choice_master',
    name: 'Multiple Choice Master',
    description: 'Answer 50 multiple choice questions correctly',
    icon: '✓',
    rarity: 'rare',
    condition: (stats) => stats.multipleChoiceCorrect >= 50,
    xpReward: 250
  },
  {
    id: 'true_false_expert',
    name: 'True/False Expert',
    description: 'Answer 50 true/false questions correctly',
    icon: '⚖️',
    rarity: 'rare',
    condition: (stats) => stats.trueFalseCorrect >= 50,
    xpReward: 200
  },
  {
    id: 'flashcard_adept',
    name: 'Flashcard Adept',
    description: 'Complete 100 flashcards',
    icon: '🧠',
    rarity: 'rare',
    condition: (stats) => stats.totalFlashcardsCompleted >= 100,
    xpReward: 300
  },

  // Epic Achievements (Gold tier)
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 7-day study streak',
    icon: '🔥',
    rarity: 'epic',
    condition: (stats) => stats.currentStreak >= 7,
    xpReward: 500
  },
  {
    id: 'quiz_champion',
    name: 'Quiz Champion',
    description: 'Score 90%+ on 10 quizzes',
    icon: '👑',
    rarity: 'epic',
    condition: (stats) => stats.perfectScores >= 10,
    xpReward: 600
  },
  {
    id: 'subject_conqueror',
    name: 'Subject Conqueror',
    description: 'Complete an entire subject',
    icon: '🏅',
    rarity: 'epic',
    condition: (stats) => stats.subjectsCompleted >= 1,
    xpReward: 800
  },
  {
    id: 'knowledge_master',
    name: 'Knowledge Master',
    description: 'Reach level 15',
    icon: '🎓',
    rarity: 'epic',
    condition: (stats) => stats.level >= 15,
    xpReward: 750
  },
  {
    id: 'section_expert',
    name: 'Section Expert',
    description: 'Complete 50 sections',
    icon: '🏆',
    rarity: 'epic',
    condition: (stats) => stats.totalSectionsCompleted >= 50,
    xpReward: 500
  },
  {
    id: 'fill_master',
    name: 'Fill-in Master',
    description: 'Answer 25 fill-in-blank questions correctly',
    icon: '📝',
    rarity: 'epic',
    condition: (stats) => stats.fillInBlankCorrect >= 25,
    xpReward: 300
  },
  {
    id: 'numerical_genius',
    name: 'Numerical Genius',
    description: 'Answer 25 numerical questions correctly',
    icon: '🔢',
    rarity: 'epic',
    condition: (stats) => stats.numericalCorrect >= 25,
    xpReward: 400
  },
  {
    id: 'matching_pro',
    name: 'Matching Pro',
    description: 'Answer 25 matching questions correctly',
    icon: '🔗',
    rarity: 'epic',
    condition: (stats) => stats.matchingCorrect >= 25,
    xpReward: 300
  },
  {
    id: 'versatile_learner',
    name: 'Versatile Learner',
    description: 'Master all question types (10+ correct in each)',
    icon: '🌟',
    rarity: 'epic',
    condition: (stats) =>
      stats.multipleChoiceCorrect >= 10 &&
      stats.trueFalseCorrect >= 10 &&
      stats.fillInBlankCorrect >= 10 &&
      stats.numericalCorrect >= 10 &&
      stats.matchingCorrect >= 10,
    xpReward: 600
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Maintain a 95% average score',
    icon: '💎',
    rarity: 'epic',
    condition: (stats) => stats.averageScore >= 95,
    xpReward: 1000
  },

  // Legendary Achievements (Platinum tier)
  {
    id: 'unstoppable_streak',
    name: 'Unstoppable',
    description: 'Maintain a 30-day study streak',
    icon: '⚡',
    rarity: 'legendary',
    condition: (stats) => stats.currentStreak >= 30,
    xpReward: 2000
  },
  {
    id: 'engineering_legend',
    name: 'Engineering Legend',
    description: 'Complete all subjects',
    icon: '🌟',
    rarity: 'legendary',
    condition: (stats) => stats.subjectsCompleted >= 3, // Assuming 3 subjects for now
    xpReward: 3000
  },
  {
    id: 'quiz_grandmaster',
    name: 'Quiz Grandmaster',
    description: 'Complete 200 quizzes',
    icon: '🏆',
    rarity: 'legendary',
    condition: (stats) => stats.totalQuizzesCompleted >= 200,
    xpReward: 2500
  },
  {
    id: 'concrete_specialist',
    name: 'Concrete Specialist',
    description: 'Complete all Concrete Technology content',
    icon: '🏗️',
    rarity: 'legendary',
    condition: (stats) => {
      // This will be updated by backend to check specific subject completion
      return stats.subjectsCompleted >= 1;
    },
    xpReward: 800
  },
  {
    id: 'environmental_guardian',
    name: 'Environmental Guardian',
    description: 'Complete all Environmental Engineering content',
    icon: '🌍',
    rarity: 'legendary',
    condition: (stats) => {
      // This will be updated by backend to check specific subject completion
      return stats.subjectsCompleted >= 2;
    },
    xpReward: 800
  },
  {
    id: 'water_resources_expert',
    name: 'Water Resources Expert',
    description: 'Complete all Water Resources Engineering content',
    icon: '💧',
    rarity: 'legendary',
    condition: (stats) => {
      // This will be updated by backend to check specific subject completion
      return stats.subjectsCompleted >= 3;
    },
    xpReward: 800
  },
  {
    id: 'knowledge_deity',
    name: 'Knowledge Deity',
    description: 'Reach level 50',
    icon: '👑',
    rarity: 'legendary',
    condition: (stats) => stats.level >= 50,
    xpReward: 5000
  }
];

export function checkAchievements(userStats: UserStats, currentAchievements: string[]): Achievement[] {
  const newAchievements: Achievement[] = [];
  
  for (const achievement of ACHIEVEMENTS) {
    // Skip if user already has this achievement
    if (currentAchievements.includes(achievement.id)) {
      continue;
    }
    
    // Check if user meets the condition
    if (achievement.condition(userStats)) {
      newAchievements.push(achievement);
    }
  }
  
  return newAchievements;
}

export function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'from-gray-500 to-gray-600 border-gray-400';
    case 'rare':
      return 'from-blue-500 to-cyan-600 border-blue-400';
    case 'epic':
      return 'from-indigo-500 to-purple-600 border-indigo-400';
    case 'legendary':
      return 'from-purple-500 to-pink-600 border-purple-400';
    default:
      return 'from-gray-400 to-gray-500 border-gray-300';
  }
}
