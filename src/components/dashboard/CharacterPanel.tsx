'use client';

import { useSession } from 'next-auth/react';
import { useDashboard } from '@/context/DashboardProvider';
import { motion } from 'framer-motion';
import { Flame, Star, Trophy, Zap } from 'lucide-react';

export function CharacterPanel() {
  const { data: session } = useSession();
  const { studentProgress, isLoading } = useDashboard();

  if (isLoading || !studentProgress) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6">
        <div className="animate-pulse flex items-center space-x-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate XP progress to next level
  const currentLevelXP = (studentProgress.level - 1) * 100; // XP needed for current level
  const nextLevelXP = studentProgress.level * 100; // XP needed for next level
  const progressXP = studentProgress.xp - currentLevelXP; // XP progress in current level
  const xpPercentage = (progressXP / 100) * 100; // Percentage to next level
  const firstName = session?.user?.name?.split(' ')[0] || 'Student';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 rounded-2xl shadow-xl border border-indigo-200 p-6 text-white relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-32 h-32 border border-white/20 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 border border-white/20 rounded-full"></div>
      </div>

      <div className="relative flex items-center justify-between">
        {/* Character Info */}
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
              L{studentProgress.level}
            </div>
          </div>

          {/* Character Details */}
          <div className="space-y-2">
            <div>
              <h2 className="text-2xl font-bold">Welcome back, {firstName}!</h2>
              <p className="text-indigo-100">Level {studentProgress.level} Civil Engineer</p>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-100">Experience Points</span>
                <span className="font-medium">{progressXP} / 100 XP to Level {studentProgress.level + 1}</span>
              </div>
              <div className="w-64 h-3 bg-indigo-800/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Daily Streak */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20"
          >
            <div className="flex items-center justify-center mb-2">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div className="text-2xl font-bold">{studentProgress.currentStreak}</div>
            <div className="text-xs text-indigo-100">Day Streak</div>
          </motion.div>

          {/* Average Score */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20"
          >
            <div className="flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold">{studentProgress.averageScore}%</div>
            <div className="text-xs text-indigo-100">Avg Score</div>
          </motion.div>

          {/* Total Quizzes */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20"
          >
            <div className="flex items-center justify-center mb-2">
              <Trophy className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold">{studentProgress.totalQuizzesCompleted}</div>
            <div className="text-xs text-indigo-100">Quizzes Done</div>
          </motion.div>

          {/* Badges Count */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20"
          >
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-2xl font-bold">{studentProgress.badges.length}</div>
            <div className="text-xs text-indigo-100">Badges</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
} 