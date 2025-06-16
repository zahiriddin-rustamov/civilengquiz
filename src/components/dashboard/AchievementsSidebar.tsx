'use client';

import { motion } from 'framer-motion';
import { useDashboard } from '@/context/DashboardProvider';
import { Badge } from '@/context/DashboardProvider';
import { Trophy, Star, Zap, Clock } from 'lucide-react';

export function AchievementsSidebar() {
  const { studentProgress, isLoading } = useDashboard();

  if (isLoading || !studentProgress) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Recent Achievements</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm border animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getRarityStyle = (rarity: Badge['rarity']) => {
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

  const recentBadges = studentProgress.badges
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Recent Achievements */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Recent Achievements</h3>
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>

        <div className="space-y-3">
          {recentBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-gradient-to-r ${getRarityStyle(badge.rarity)} rounded-lg p-3 text-white shadow-sm`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{badge.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{badge.name}</div>
                  <div className="text-xs opacity-90 truncate">{badge.description}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(badge.unlockedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {/* Rarity indicator */}
              <div className="absolute top-1 right-1">
                <div className={`w-2 h-2 rounded-full ${
                  badge.rarity === 'legendary' ? 'bg-yellow-300' :
                  badge.rarity === 'epic' ? 'bg-purple-300' :
                  badge.rarity === 'rare' ? 'bg-blue-300' : 'bg-gray-300'
                }`}></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">This Week</span>
            </div>
            <span className="font-semibold text-gray-800">12 XP</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600">Best Streak</span>
            </div>
            <span className="font-semibold text-gray-800">15 days</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">Study Time</span>
            </div>
            <span className="font-semibold text-gray-800">2.5h</span>
          </div>
        </div>
      </div>
    </div>
  );
} 