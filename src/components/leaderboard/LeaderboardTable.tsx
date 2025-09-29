'use client';

import { motion } from 'framer-motion';
import { Crown, Trophy, Medal } from 'lucide-react';
import { RankChangeIndicator } from './RankChangeIndicator';
import { StreakDisplay } from './StreakDisplay';

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

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  currentUserRank?: LeaderboardEntry | null;
  isLoading?: boolean;
  className?: string;
}

export function LeaderboardTable({
  leaderboard,
  currentUserRank,
  isLoading = false,
  className = ''
}: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">
            {rank}
          </div>
        );
    }
  };

  const getRankBackgroundColor = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200';
    }

    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
      default:
        return 'bg-white border-gray-200';
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

  const UserRow = ({ user, index }: { user: LeaderboardEntry; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className={`
        rounded-xl p-4 border transition-all duration-200 hover:shadow-md
        ${getRankBackgroundColor(user.rank, user.isCurrentUser)}
      `}
    >
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Current Rank (Left Side) */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200">
            <span className="text-lg font-bold text-gray-700">#{user.rank}</span>
          </div>

          {/* Avatar & Name */}
          <div className="flex items-center space-x-3">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg
              bg-gradient-to-br ${getAvatarColor(user.rank)} shadow-lg
            `}>
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className={`font-semibold ${
                user.isCurrentUser
                  ? 'text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text'
                  : 'text-gray-800'
              }`}>
                {user.displayName}
                {user.isCurrentUser && (
                  <span className="ml-2 text-xs font-bold text-indigo-600">(You)</span>
                )}
              </h3>
              <p className="text-sm text-gray-600">Level {user.level}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* XP */}
          <div className="text-right">
            <div className="font-bold text-lg text-gray-800">
              {(user.totalXP || 0).toLocaleString()} XP
            </div>
            <div className="text-sm text-gray-600">Total Experience</div>
          </div>

          {/* Rank Change */}
          <div className="text-center">
            <RankChangeIndicator
              rankChange={user.rankChange}
              rankChangeType={user.rankChangeType}
            />
          </div>

          {/* Streaks */}
          <StreakDisplay
            currentStreak={user.currentStreak}
            learningStreak={user.learningStreak}
            showLabels={false}
            size="sm"
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Current Rank (Mobile) */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-200">
              <span className="text-sm font-bold text-gray-700">#{user.rank}</span>
            </div>
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
              bg-gradient-to-br ${getAvatarColor(user.rank)}
            `}>
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className={`font-semibold ${
                user.isCurrentUser
                  ? 'text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text'
                  : 'text-gray-800'
              }`}>
                {user.displayName}
                {user.isCurrentUser && (
                  <span className="ml-2 text-xs font-bold text-indigo-600">(You)</span>
                )}
              </h3>
              <p className="text-sm text-gray-600">Level {user.level}</p>
            </div>
          </div>
          <RankChangeIndicator
            rankChange={user.rankChange}
            rankChangeType={user.rankChangeType}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="font-bold text-lg text-gray-800">
            {(user.totalXP || 0).toLocaleString()} XP
          </div>
          <StreakDisplay
            currentStreak={user.currentStreak}
            learningStreak={user.learningStreak}
            showLabels={false}
            size="sm"
            layout="horizontal"
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="hidden md:flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-600 border-b border-gray-200">
        <div className="flex-1">Rank & Player</div>
        <div className="flex items-center space-x-6">
          <div className="w-24 text-right">Experience</div>
          <div className="w-20 text-center">Change</div>
          <div className="w-32 text-right">Streaks</div>
        </div>
      </div>

      {/* Leaderboard Entries */}
      {leaderboard.map((user, index) => (
        <UserRow key={user.userId} user={user} index={index} />
      ))}

      {/* Current User Rank (if not in top list) */}
      {currentUserRank && !leaderboard.some(u => u.isCurrentUser) && (
        <>
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <span className="text-sm font-medium">Your Position</span>
              <div className="w-8 h-0.5 bg-gray-300"></div>
            </div>
          </div>
          <UserRow user={currentUserRank} index={0} />
        </>
      )}

      {/* Empty State */}
      {leaderboard.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No rankings available yet
          </h3>
          <p className="text-gray-500">
            Complete some quizzes to appear on the leaderboard!
          </p>
        </div>
      )}
    </div>
  );
}