'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Trophy,
  Crown,
  Users,
  TrendingUp,
  Calendar,
  Info
} from 'lucide-react';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { Button } from '@/components/ui/button';

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

interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
  currentUserRank?: LeaderboardEntry | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  lastUpdated: string;
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/leaderboard');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }

      setLeaderboardData(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLeaderboard();
    }
  }, [status]);

  // Loading state
  if (status === 'loading' || (isLoading && !leaderboardData)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-600 font-medium">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Unable to load leaderboard
          </h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => fetchLeaderboard()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <Crown className="w-8 h-8 text-indigo-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Leaderboard
              </h1>
              <p className="text-gray-600">Compete with fellow civil engineers</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {leaderboardData?.pagination.totalUsers || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Players</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-4 border border-green-100 shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {(() => {
                      // Check if user is in the main leaderboard
                      const userInLeaderboard = leaderboardData?.leaderboard.find(user => user.isCurrentUser);
                      if (userInLeaderboard) {
                        return userInLeaderboard.rank;
                      }
                      // Otherwise check currentUserRank (for users not in top results)
                      return leaderboardData?.currentUserRank?.rank || '—';
                    })()}
                  </div>
                  <div className="text-sm text-gray-600">Your Rank</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-4 border border-yellow-100 shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {leaderboardData?.leaderboard[0]?.totalXP?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Top Score</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {leaderboardData?.lastUpdated ? formatLastUpdated(leaderboardData.lastUpdated) : 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-600">Last Updated</div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6"
        >
          <LeaderboardTable
            leaderboard={leaderboardData?.leaderboard || []}
            currentUserRank={leaderboardData?.currentUserRank}
            isLoading={isLoading}
          />
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How Rankings Work</p>
              <p>
                Rankings are based on total XP earned from quizzes, flashcards, and videos.
                Position changes are updated daily at midnight.
                {leaderboardData?.currentUserRank?.rankChangeType === 'new' && (
                  <span className="font-medium"> Welcome to the leaderboard! 🎉</span>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}