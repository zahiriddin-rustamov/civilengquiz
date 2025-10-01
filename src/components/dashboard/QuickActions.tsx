'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Shuffle,
  Target,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import { useDashboard } from '@/context/DashboardProvider';

interface RecentActivity {
  contentType: string;
  contentId: string;
  topicId: string;
  subjectId: string;
  sectionId?: string;
  lastAccessed: string;
  completed: boolean;
  score?: number;
  topicName?: string;
  subjectName?: string;
}

interface DailyGoals {
  target: number;
  completed: number;
  type: string;
}

export function QuickActions() {
  const { studentProgress, isLoading } = useDashboard();
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    target: 3,
    completed: 0,
    type: 'quiz sessions'
  });
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
    fetchDailyProgress();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/user/recent-activity');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.lastActivity);
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const fetchDailyProgress = async () => {
    try {
      const response = await fetch('/api/user/daily-progress');
      if (response.ok) {
        const data = await response.json();
        setDailyGoals({
          target: data.target || 3,
          completed: data.completed || 0,
          type: data.type || 'quiz sessions'
        });
      }
    } catch (error) {
      console.error('Failed to fetch daily progress:', error);
    }
  };

  // Generate continue learning link based on recent activity
  const getContinueLearningLink = () => {
    if (!recentActivity) {
      // If no recent activity, suggest the first unlocked incomplete topic
      if (studentProgress) {
        for (const subject of studentProgress.subjectProgress) {
          if (subject.isUnlocked) {
            for (const topic of subject.topics) {
              if (topic.isUnlocked && !topic.isCompleted) {
                return `/subjects/${subject.id}/topics/${topic.id}`;
              }
            }
          }
        }
      }
      return '/subjects'; // Fallback to subjects page
    }

    // Validate that required IDs exist
    if (!recentActivity.subjectId || !recentActivity.topicId) {
      return '/subjects';
    }

    // If recent activity exists and not completed, continue from there
    if (!recentActivity.completed) {
      if (recentActivity.contentType === 'section' && recentActivity.sectionId) {
        return `/subjects/${recentActivity.subjectId}/topics/${recentActivity.topicId}/sections/${recentActivity.sectionId}/questions`;
      } else if (recentActivity.contentType === 'flashcard') {
        return `/subjects/${recentActivity.subjectId}/topics/${recentActivity.topicId}/flashcards`;
      } else if (recentActivity.contentType === 'media') {
        return `/subjects/${recentActivity.subjectId}/topics/${recentActivity.topicId}/media`;
      } else {
        return `/subjects/${recentActivity.subjectId}/topics/${recentActivity.topicId}`;
      }
    }

    // If last activity was completed, suggest next topic
    return `/subjects/${recentActivity.subjectId}/topics/${recentActivity.topicId}`;
  };

  const getContinueLearningDescription = () => {
    if (loadingRecent) return 'Loading...';
    if (!recentActivity) return 'Start your learning journey';

    const contentTypeLabel = recentActivity.contentType === 'section' ? 'questions' :
                            recentActivity.contentType === 'flashcard' ? 'flashcards' :
                            recentActivity.contentType === 'media' ? 'videos' : 'topic';

    return recentActivity.completed
      ? `Continue with ${recentActivity.topicName || 'next topic'}`
      : `Resume ${contentTypeLabel} - ${Math.round((recentActivity.score || 0))}% complete`;
  };

  const quickActions = [
    {
      id: 'continue',
      title: 'Continue Learning',
      description: getContinueLearningDescription(),
      icon: BookOpen,
      color: 'from-green-500 to-emerald-600',
      href: getContinueLearningLink(),
      badge: recentActivity && !recentActivity.completed ? 'In Progress' : 'Resume'
    },
    {
      id: 'random',
      title: 'Random Quiz',
      description: 'Test your knowledge across topics',
      icon: Shuffle,
      color: 'from-purple-500 to-violet-600',
      href: '/quiz/random',
      badge: 'Practice Mode'
    },
    {
      id: 'timed',
      title: 'Timed Quiz',
      description: '10 seconds per question challenge',
      icon: Clock,
      color: 'from-cyan-500 to-blue-600',
      href: '/quiz/timed',
      badge: 'Time Challenge'
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      description: 'See how you rank against others',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-600',
      href: '/leaderboard',
      badge: 'Compete'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
        <div className="flex items-center text-sm text-gray-500">
          <Sparkles className="w-4 h-4 mr-1" />
          Ready to learn?
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="group"
          >
            <Link href={action.href}>
              <div className={`relative bg-gradient-to-br ${action.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden h-full min-h-[180px] flex flex-col`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-2 w-16 h-16 border border-white/30 rounded-full"></div>
                  <div className="absolute bottom-2 left-2 w-12 h-12 border border-white/30 rounded-full"></div>
                </div>

                {/* Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    action.isNew
                      ? 'bg-yellow-400 text-yellow-900 animate-pulse'
                      : 'bg-white/20 text-white'
                  }`}>
                    {action.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="relative space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <action.icon className="w-8 h-8" />
                    {action.isNew && (
                      <Zap className="w-5 h-5 text-yellow-300 animate-bounce" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-1">{action.title}</h4>
                    <p className="text-sm opacity-90 line-clamp-2">{action.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs opacity-75">Click to start</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Today's Goal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-xl p-4 border border-indigo-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Today's Goal</h4>
              <p className="text-sm text-gray-600">Complete {dailyGoals.target} {dailyGoals.type}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Progress */}
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800">
                {dailyGoals.completed} / {dailyGoals.target} completed
              </div>
              <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((dailyGoals.completed / dailyGoals.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <Link href={getContinueLearningLink()}>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                {dailyGoals.completed >= dailyGoals.target ? '🎉 Goal Met!' : 'Continue'}
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 