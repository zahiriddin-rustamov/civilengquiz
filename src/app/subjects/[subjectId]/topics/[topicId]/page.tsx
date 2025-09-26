'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft,
  BookOpen, 
  Lock, 
  Star, 
  Trophy,
  Zap,
  Target,
  Play,
  FileText,
  CheckCircle,
  Circle,
  Clock,
  Award,
  Users,
  TrendingUp,
  Brain,
  Lightbulb,
  Medal,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Enhanced topic data type for UI
interface EnhancedTopicData {
  _id: any;
  name: string;
  description: string;
  longDescription?: string;
  imageUrl?: string;
  subjectId: any;
  order: number;
  isUnlocked: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
  // Enhanced UI data
  subjectName: string;
  progress: number;
  contentCounts: {
    questions: number;
    flashcards: number;
    media: number;
  };
  completedContent: {
    questions: number;
    flashcards: number;
    media: number;
  };
  hasAccessibleSections: boolean; // Whether there are sections with questions
  // TODO: Add these when implementing user progress
  achievements: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    unlocked: boolean;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  }[];
  streakDays: number;
  lastAccessed: Date;
}

export default function TopicOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [topicData, setTopicData] = useState<EnhancedTopicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subjectId = params.subjectId as string;
  const topicId = params.topicId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && subjectId && topicId) {
      fetchTopicData();
    }
  }, [status, subjectId, topicId, router]);

  const fetchTopicData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch topic data with content counts
      const topicResponse = await fetch(`/api/topics/${topicId}`);
      if (!topicResponse.ok) {
        if (topicResponse.status === 404) {
          router.push(`/subjects/${subjectId}`);
          return;
        }
        throw new Error('Failed to fetch topic');
      }

      const topicApiData = await topicResponse.json();

      // Fetch subject name
      const subjectResponse = await fetch(`/api/subjects/${subjectId}`);
      let subjectName = 'Unknown Subject';
      if (subjectResponse.ok) {
        const subjectData = await subjectResponse.json();
        subjectName = subjectData.name;
      }

      // Transform data to match our UI interface
      const enhancedTopicData: EnhancedTopicData = {
        _id: topicApiData._id,
        name: topicApiData.name,
        description: topicApiData.description,
        longDescription: topicApiData.longDescription,
        imageUrl: topicApiData.imageUrl,
        subjectId: topicApiData.subjectId,
        order: topicApiData.order,
        isUnlocked: topicApiData.isUnlocked,
        difficulty: topicApiData.difficulty,
        estimatedMinutes: topicApiData.estimatedMinutes,
        xpReward: topicApiData.xpReward,
        createdAt: topicApiData.createdAt,
        updatedAt: topicApiData.updatedAt,
        subjectName,
        progress: topicApiData.progress || 0,
        contentCounts: topicApiData.contentCounts || { questions: 0, flashcards: 0, media: 0 },
        completedContent: topicApiData.completedContent || { questions: 0, flashcards: 0, media: 0 },
        hasAccessibleSections: topicApiData.hasAccessibleSections || false,
        // TODO: Implement these when adding user progress tracking
        achievements: [],
        streakDays: 0,
        lastAccessed: new Date()
      };

      setTopicData(enhancedTopicData);
    } catch (err) {
      console.error('Error fetching topic data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load topic data');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get topic color based on difficulty
  const getTopicColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'from-emerald-500 to-green-600';
      case 'Intermediate': return 'from-amber-500 to-orange-600';
      case 'Advanced': return 'from-red-500 to-rose-600';
      default: return 'from-slate-500 to-gray-600';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-emerald-700 bg-emerald-100/95 backdrop-blur-sm border-emerald-200';
      case 'Intermediate': return 'text-amber-700 bg-amber-100/95 backdrop-blur-sm border-amber-200';
      case 'Advanced': return 'text-red-700 bg-red-100/95 backdrop-blur-sm border-red-200';
      default: return 'text-slate-700 bg-slate-100/95 backdrop-blur-sm border-slate-200';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-blue-500 to-cyan-600';
    if (percentage >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-gray-400 to-gray-500';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'from-purple-500 to-pink-600 border-purple-400';
      case 'Epic': return 'from-indigo-500 to-purple-600 border-indigo-400';
      case 'Rare': return 'from-blue-500 to-cyan-600 border-blue-400';
      case 'Common': return 'from-gray-500 to-gray-600 border-gray-400';
      default: return 'from-gray-400 to-gray-500 border-gray-300';
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading topic...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Topic</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-x-4">
              <Button onClick={fetchTopicData} variant="outline">
                Try Again
              </Button>
              <Button asChild>
                <Link href={`/subjects/${subjectId}`}>Back to Subject</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!topicData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Topic not found</h2>
            <p className="mt-2 text-gray-600">The requested topic could not be found.</p>
            <Button asChild className="mt-4">
              <Link href={`/subjects/${subjectId}`}>Back to Subject</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalContentItems = topicData.contentCounts.questions + 
                           topicData.contentCounts.flashcards + 
                           topicData.contentCounts.media;
  
  const completedContentItems = topicData.completedContent.questions + 
                               topicData.completedContent.flashcards + 
                               topicData.completedContent.media;

  return (
    <div className="min-h-screen">
      {/* Full-width Modern Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-80 overflow-hidden"
      >
          {/* Background Image or Gradient */}
          {topicData.imageUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${topicData.imageUrl})`
                }}
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80" />
            </>
          ) : (
            /* Fallback gradient background */
            <div className={`absolute inset-0 bg-gradient-to-br ${getTopicColor(topicData.difficulty)}`} />
          )}

          {/* Subtle overlay patterns */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-60" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-40" />

          {/* Additional dark overlay for gradient backgrounds */}
          {!topicData.imageUrl && (
            <div className="absolute inset-0 bg-black/30" />
          )}

        <div className="relative h-full flex flex-col justify-center px-4">
          <div className="max-w-6xl mx-auto w-full">
            <Link
              href={`/subjects/${subjectId}`}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm mb-4 transition-all duration-300 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 hover:bg-white/15 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {topicData.subjectName}
            </Link>

            {/* Main Content - Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-8 items-center">
              {/* Left Column - Title and Description */}
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(topicData.difficulty)}`}>
                    {topicData.difficulty}
                  </div>
                  {topicData.streakDays > 0 && (
                    <div className="flex items-center space-x-1 bg-orange-500/20 px-2 py-1 rounded-full backdrop-blur-sm border border-orange-300/20">
                      <Flame className="w-3 h-3 text-orange-300" />
                      <span className="text-xs font-medium">{topicData.streakDays} day streak</span>
                    </div>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">{topicData.name}</h1>
                <p className="text-white/80 text-base leading-relaxed mb-2">{topicData.description}</p>

                {/* Progress Bar - Inline */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/90 font-medium text-sm">Progress</span>
                    <span className="font-bold text-white">{topicData.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${topicData.progress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                      className={`h-full bg-gradient-to-r ${getProgressColor(topicData.progress)} rounded-full shadow-sm`}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Compact Stats */}
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Target className="w-4 h-4 text-white" />
                    <span className="text-white/70 font-medium text-xs">Completed</span>
                  </div>
                  <div className="text-xl font-bold text-white">{completedContentItems}/{totalContentItems}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                    <Zap className="w-4 h-4 text-white mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{topicData.xpReward}</div>
                    <div className="text-white/70 text-xs">XP</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                    <Clock className="w-4 h-4 text-white mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{topicData.estimatedMinutes}m</div>
                    <div className="text-white/70 text-xs">Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Content Types Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose Your Learning Path</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Questions Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ContentTypeCard
                  type="questions"
                  title="Questions"
                  description="Test your knowledge with quizzes and practice problems"
                  icon={<FileText className="w-8 h-8" />}
                  color="from-blue-400 to-blue-500"
                  data={{
                    count: topicData.contentCounts.questions,
                    completed: topicData.completedContent.questions,
                    timeSpent: 0 // TODO: Add real time tracking
                  }}
                  href={`/subjects/${subjectId}/topics/${topicId}/sections`}
                  isUnlocked={topicData.isUnlocked}
                  hasAccessibleSections={topicData.hasAccessibleSections}
                />
              </motion.div>

              {/* Flashcards Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ContentTypeCard
                  type="flashcards"
                  title="Flashcards"
                  description="Memorize key concepts with spaced repetition"
                  icon={<BookOpen className="w-8 h-8" />}
                  color="from-emerald-400 to-emerald-500"
                  data={{
                    count: topicData.contentCounts.flashcards,
                    completed: topicData.completedContent.flashcards,
                    mastered: topicData.completedContent.flashcards, // Simplified for now
                    timeSpent: 0 // TODO: Add real time tracking
                  }}
                  href={`/subjects/${subjectId}/topics/${topicId}/flashcards`}
                  isUnlocked={topicData.isUnlocked}
                />
              </motion.div>

              {/* Media Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ContentTypeCard
                  type="media"
                  title="Media"
                  description="Watch videos and explore interactive content"
                  icon={<Play className="w-8 h-8" />}
                  color="from-indigo-400 to-indigo-500"
                  data={{
                    count: topicData.contentCounts.media,
                    completed: topicData.completedContent.media,
                    timeSpent: 0 // TODO: Add real time tracking
                  }}
                  href={`/subjects/${subjectId}/topics/${topicId}/media`}
                  isUnlocked={topicData.isUnlocked}
                />
              </motion.div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>Achievements</span>
              </h3>
              
              {topicData.achievements.length === 0 ? (
                <p className="text-gray-500 text-sm">Complete activities to unlock achievements!</p>
              ) : (
                <div className="space-y-3">
                  {topicData.achievements.map((achievement, index) => (
                    <div
                      key={achievement.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 ${
                        achievement.unlocked 
                          ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white` 
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {achievement.unlocked ? achievement.icon : <Lock className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{achievement.name}</p>
                        <p className="text-xs opacity-80">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Study Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <span>Study Tips</span>
              </h3>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <Brain className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>Start with flashcards to build foundational knowledge</p>
                </div>
                <div className="flex items-start space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Practice questions to test your understanding</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Users className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <p>Watch media content for visual learning</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// Content Type Card Component
function ContentTypeCard({
  type,
  title,
  description,
  icon,
  color,
  data,
  href,
  isUnlocked,
  hasAccessibleSections
}: {
  type: 'questions' | 'flashcards' | 'media';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  data: any;
  href: string;
  isUnlocked: boolean;
  hasAccessibleSections?: boolean;
}) {
  const getCompletionPercentage = () => {
    if (type === 'questions' || type === 'media') {
      return data.count > 0 ? Math.round((data.completed / data.count) * 100) : 0;
    } else if (type === 'flashcards') {
      return data.count > 0 ? Math.round((data.mastered / data.count) * 100) : 0;
    }
    return 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-blue-500 to-cyan-600';
    if (percentage >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-gray-400 to-gray-500';
  };

  const completionPercentage = getCompletionPercentage();

  // For questions, check if there are accessible sections; for others, check count
  const hasContent = type === 'questions'
    ? (hasAccessibleSections ?? data.count > 0)
    : data.count > 0;
  const isClickable = isUnlocked && hasContent;

  const CardContent = () => (
    <div className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${color} text-white transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
      isClickable ? 'shadow-xl hover:shadow-2xl cursor-pointer border border-white/30' :
      !hasContent ? 'opacity-50 cursor-not-allowed border border-gray-300' :
      'opacity-75 cursor-not-allowed border border-gray-300'
    }`}
         style={{ minHeight: '320px' }}>
      {/* Subtle overlay patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-60" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-40" />

      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Lock Overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
          <div className="text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/20">
              <Lock className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold mb-1">Locked</h4>
            <p className="text-sm font-medium opacity-90">Complete Previous Topics</p>
            <p className="text-xs opacity-75 mt-2">Continue your learning journey</p>
          </div>
        </div>
      )}

      {isUnlocked && !hasContent && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
          <div className="text-center text-white">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No content available</p>
            <p className="text-xs opacity-80 mt-1">Content coming soon</p>
          </div>
        </div>
      )}

      <div className="relative z-10 p-6 h-full flex flex-col text-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
            {icon}
          </div>
          {completionPercentage === 100 && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg border-2 border-yellow-300/50">
              <Trophy className="w-5 h-5 text-yellow-900" />
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="flex-1 mb-4">
          <h3 className="text-xl font-bold mb-2 drop-shadow-lg">{title}</h3>
          <p className="text-white/90 text-sm leading-relaxed drop-shadow-sm" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/80">Progress</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${getProgressColor(completionPercentage)} rounded-full`}
            />
          </div>
        </div>

        {/* Stats - Compact Layout */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
              <span className="font-semibold">{data.count} Total</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
              <span className="font-semibold">
                {type === 'flashcards' ? data.mastered : data.completed} Done
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isUnlocked && hasContent && (
          <div className="pt-2">
            <div className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2.5 text-center font-bold hover:bg-white/30 transition-all duration-300 shadow-lg text-sm">
              <span className="flex items-center justify-center space-x-2">
                <span>{completionPercentage === 0 ? 'Start' : 'Continue'}</span>
                <Target className="w-4 h-4" />
              </span>
            </div>
          </div>
        )}

        {isUnlocked && !hasContent && (
          <div className="pt-2">
            <div className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-center font-medium text-white/60 cursor-not-allowed text-sm">
              Coming Soon
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return isClickable ? (
    <Link href={href}>
      <CardContent />
    </Link>
  ) : (
    <CardContent />
  );
} 