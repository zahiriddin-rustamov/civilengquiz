'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';
import { RankChangeIndicator } from '@/components/leaderboard/RankChangeIndicator';

interface LeaderboardEntry {
  userId: string;
  rank: number;
  name: string;
  displayName: string;
  totalXP: number;
  level: number;
  currentStreak: number;
  learningStreak: number;
  rankChange: number;
  rankChangeType: 'up' | 'down' | 'none' | 'new';
  isCurrentUser: boolean;
}

interface LeaderboardWidgetProps {
  className?: string;
}

export function LeaderboardWidget({ className = '' }: LeaderboardWidgetProps) {
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopLeaderboard();
  }, []);

  const fetchTopLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard?limit=5');
      const data = await response.json();

      if (data.success) {
        setTopUsers(data.leaderboard);
        setCurrentUserRank(data.currentUserRank);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard widget data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Trophy className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Medal className="w-4 h-4 text-amber-600" />;
      default:
        return (
          <div className="w-4 h-4 flex items-center justify-center text-xs font-bold text-gray-600">
            {rank}
          </div>
        );
    }
  };

  const getAvatarColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-orange-500';
      case 2:
        return 'from-gray-400 to-gray-500';
      case 3:
        return 'from-amber-400 to-orange-500';
      default:
        return 'from-indigo-400 to-purple-500';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Leaderboard</h3>
          <Trophy className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-2 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-800">Leaderboard</h3>
          {(() => {
            // Show user's rank in header
            const userInTop = topUsers.find(user => user.isCurrentUser);
            const userRank = userInTop ? userInTop.rank : currentUserRank?.rank;

            if (userRank) {
              return (
                <span className="text-sm text-indigo-600 font-medium">
                  (You: #{userRank})
                </span>
              );
            }
            return null;
          })()}
        </div>
        <Link
          href="/leaderboard"
          className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Top 5 List */}
      <div className="space-y-3 mb-4">
        {topUsers.map((user, index) => (
          <motion.div
            key={user.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              flex items-center justify-between p-3 rounded-lg border transition-all duration-200
              ${user.isCurrentUser
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {getRankIcon(user.rank)}
                <RankChangeIndicator
                  rankChange={user.rankChange}
                  rankChangeType={user.rankChangeType}
                />
              </div>

              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                bg-gradient-to-br ${getAvatarColor(user.rank)}
              `}>
                {user.displayName.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className={`font-medium text-sm ${
                  user.isCurrentUser
                    ? 'text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text'
                    : 'text-gray-800'
                }`}>
                  {user.displayName}
                  {user.isCurrentUser && (
                    <span className="text-xs font-bold text-indigo-600 ml-1">(You)</span>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  Level {user.level || 1} • {(user.totalXP || 0).toLocaleString()} XP
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Current User Rank (if not in top 5) */}
      {currentUserRank && !topUsers.some(u => u.isCurrentUser) && (
        <>
          <div className="border-t border-gray-200 pt-3 mb-3">
            <div className="flex items-center justify-center">
              <span className="text-xs text-gray-500">Your Position</span>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-200"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 flex items-center justify-center text-xs font-bold text-gray-600">
                  {currentUserRank.rank}
                </div>
                <RankChangeIndicator
                  rankChange={currentUserRank.rankChange}
                  rankChangeType={currentUserRank.rankChangeType}
                />
              </div>

              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-indigo-400 to-purple-500">
                {currentUserRank.displayName.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="font-medium text-sm text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                  {currentUserRank.displayName}
                  <span className="text-xs font-bold text-indigo-600 ml-1">(You)</span>
                </div>
                <div className="text-xs text-gray-600">
                  Level {currentUserRank.level || 1} • {(currentUserRank.totalXP || 0).toLocaleString()} XP
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Empty State */}
      {topUsers.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No rankings available yet</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-gray-200">
        <Link
          href="/leaderboard"
          className="block w-full py-2 text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          View Full Leaderboard
        </Link>
      </div>
    </motion.div>
  );
}