'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, Lock, CheckCircle, Star } from 'lucide-react';
import { ACHIEVEMENTS, UserStats } from '@/lib/achievements';
import { useDashboard } from '@/context/DashboardProvider';

type RarityFilter = 'all' | 'common' | 'rare' | 'epic' | 'legendary';

interface AchievementWithProgress {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progressText?: string;
}

export default function AchievementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { studentProgress, isLoading: dashboardLoading } = useDashboard();
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('all');
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchUserStats();
    }
  }, [status, router]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/progress');
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();

      // Build user stats from user service stats
      const statsResponse = await fetch('/api/user/stats');
      let stats: UserStats;

      if (statsResponse.ok) {
        stats = await statsResponse.json();
      } else {
        // Fallback to basic stats
        stats = {
          totalXP: data.xp || 0,
          level: data.level || 0,
          totalQuizzesCompleted: 0,
          totalFlashcardsCompleted: 0,
          totalMediaCompleted: 0,
          totalSectionsCompleted: 0,
          averageScore: data.averageScore || 0,
          currentStreak: data.currentStreak || 0,
          maxStreak: data.currentStreak || 0,
          subjectsCompleted: 0,
          topicsCompleted: 0,
          perfectScores: 0,
          studyDays: 0,
          multipleChoiceCorrect: 0,
          trueFalseCorrect: 0,
          fillInBlankCorrect: 0,
          numericalCorrect: 0,
          matchingCorrect: 0
        };
      }

      setUserStats(stats);
      buildAchievementsList(data.badges || [], stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildAchievementsList = (unlockedBadges: any[], stats: UserStats) => {
    const unlockedIds = unlockedBadges.map((b) => b.id);

    const achievementsList: AchievementWithProgress[] = ACHIEVEMENTS.map((achievement) => {
      const isUnlocked = unlockedIds.includes(achievement.id);
      const unlockedBadge = unlockedBadges.find((b) => b.id === achievement.id);

      let progressText = '';

      if (!isUnlocked) {
        // Generate progress text for locked achievements
        if (achievement.id === 'first_steps') {
          progressText = `${stats.totalQuizzesCompleted}/1 quizzes`;
        } else if (achievement.id === 'knowledge_seeker') {
          progressText = `${stats.totalQuizzesCompleted}/10 quizzes`;
        } else if (achievement.id === 'dedicated_learner') {
          progressText = `${stats.totalQuizzesCompleted}/50 quizzes`;
        } else if (achievement.id === 'quiz_champion') {
          progressText = `${stats.perfectScores}/10 perfect scores`;
        } else if (achievement.id === 'quiz_grandmaster') {
          progressText = `${stats.totalQuizzesCompleted}/200 quizzes`;
        } else if (achievement.id === 'flashcard_novice') {
          progressText = `${stats.totalFlashcardsCompleted}/25 flashcards`;
        } else if (achievement.id === 'flashcard_adept') {
          progressText = `${stats.totalFlashcardsCompleted}/100 flashcards`;
        } else if (achievement.id === 'media_explorer') {
          progressText = `${stats.totalMediaCompleted}/5 media`;
        } else if (achievement.id === 'level_up') {
          progressText = `Level ${stats.level}/5`;
        } else if (achievement.id === 'knowledge_master') {
          progressText = `Level ${stats.level}/15`;
        } else if (achievement.id === 'knowledge_deity') {
          progressText = `Level ${stats.level}/50`;
        } else if (achievement.id === 'streak_starter') {
          progressText = `${stats.currentStreak}/3 day streak`;
        } else if (achievement.id === 'streak_master') {
          progressText = `${stats.currentStreak}/7 day streak`;
        } else if (achievement.id === 'unstoppable_streak') {
          progressText = `${stats.currentStreak}/30 day streak`;
        } else if (achievement.id === 'high_achiever') {
          progressText = `${stats.averageScore}%/80% average`;
        } else if (achievement.id === 'perfectionist') {
          progressText = `${stats.averageScore}%/95% average`;
        } else if (achievement.id === 'topic_master') {
          progressText = `${stats.topicsCompleted}/5 topics`;
        } else if (achievement.id === 'subject_conqueror') {
          progressText = `${stats.subjectsCompleted}/1 subject`;
        } else if (achievement.id === 'engineering_legend') {
          progressText = `${stats.subjectsCompleted}/3 subjects`;
        }
      }

      return {
        ...achievement,
        isUnlocked,
        unlockedAt: unlockedBadge?.unlockedAt,
        progressText
      };
    });

    // Sort: unlocked first, then by rarity value
    const rarityValue = { legendary: 4, epic: 3, rare: 2, common: 1 };
    achievementsList.sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
      return rarityValue[b.rarity] - rarityValue[a.rarity];
    });

    setAchievements(achievementsList);
  };

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-purple-500 to-pink-600 border-purple-400';
      case 'epic':
        return 'from-indigo-500 to-purple-600 border-indigo-400';
      case 'rare':
        return 'from-blue-500 to-cyan-600 border-blue-400';
      default:
        return 'from-gray-500 to-gray-600 border-gray-400';
    }
  };

  const filteredAchievements =
    selectedRarity === 'all'
      ? achievements
      : achievements.filter((a) => a.rarity === selectedRarity);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = ACHIEVEMENTS.length;

  if (status === 'loading' || isLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-600 font-medium">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-yellow-600" />
            <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
          </div>
          <p className="text-gray-600 mb-4">Track your learning milestones</p>

          {/* Stats Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{studentProgress?.level || 1}</div>
                <div className="text-sm text-gray-600">Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{studentProgress?.xp || 0}</div>
                <div className="text-sm text-gray-600">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {unlockedCount}/{totalCount}
                </div>
                <div className="text-sm text-gray-600">Unlocked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((unlockedCount / totalCount) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Progress</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {(['all', 'common', 'rare', 'epic', 'legendary'] as RarityFilter[]).map((rarity) => {
              const count =
                rarity === 'all'
                  ? achievements.length
                  : achievements.filter((a) => a.rarity === rarity).length;

              return (
                <button
                  key={rarity}
                  onClick={() => setSelectedRarity(rarity)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    selectedRarity === rarity
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {rarity} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`relative rounded-xl p-4 shadow-sm border-2 transition-all ${
                achievement.isUnlocked
                  ? `bg-gradient-to-br ${getRarityStyle(achievement.rarity)}`
                  : 'bg-gray-100 border-gray-300 opacity-60'
              }`}
            >
              {/* Lock/Check Icon */}
              <div className="absolute top-2 right-2">
                {achievement.isUnlocked ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {/* Achievement Icon */}
              <div className="text-4xl mb-3">{achievement.icon}</div>

              {/* Achievement Details */}
              <div className={achievement.isUnlocked ? 'text-white' : 'text-gray-700'}>
                <h3 className="font-bold text-sm mb-1">{achievement.name}</h3>
                <p className={`text-xs mb-2 ${achievement.isUnlocked ? 'opacity-90' : 'opacity-75'}`}>
                  {achievement.description}
                </p>

                {/* Progress or Date */}
                {achievement.isUnlocked && achievement.unlockedAt ? (
                  <div className="text-xs opacity-75 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                ) : achievement.progressText ? (
                  <div className="text-xs font-medium text-gray-600 bg-white/20 rounded px-2 py-1">
                    {achievement.progressText}
                  </div>
                ) : null}

                {/* XP Reward */}
                <div
                  className={`mt-2 text-xs font-bold ${
                    achievement.isUnlocked ? 'text-yellow-200' : 'text-gray-500'
                  }`}
                >
                  +{achievement.xpReward} XP
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No achievements found for this rarity.
          </div>
        )}
      </div>
    </div>
  );
}