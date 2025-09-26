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
  Image,
  CheckCircle,
  Circle,
  Clock,
  Award,
  Building2,
  Globe,
  Droplets
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ISubject, ITopic } from '@/models/database';

// Enhanced topic type for UI (plain object, not Mongoose document)
interface EnhancedTopic {
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
  progress: number;
  contentCounts: {
    questions: number;
    flashcards: number;
    media: number;
  };
}

// Helper functions for UI enhancements
const getSubjectIcon = (name: string) => {
  switch (name) {
    case 'Concrete Technology':
      return <Building2 className="w-8 h-8" />;
    case 'Environmental Engineering':
      return <Globe className="w-8 h-8" />;
    case 'Water Resources':
      return <Droplets className="w-8 h-8" />;
    default:
      return <Building2 className="w-8 h-8" />;
  }
};

const getSubjectColor = (name: string) => {
  switch (name) {
    case 'Concrete Technology':
      return 'from-blue-500 to-cyan-600';
    case 'Environmental Engineering':
      return 'from-green-500 to-emerald-600';
    case 'Water Resources':
      return 'from-indigo-500 to-purple-600';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [topics, setTopics] = useState<EnhancedTopic[]>([]);
  const [subjectInfo, setSubjectInfo] = useState<ISubject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subjectId = params.subjectId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && subjectId) {
      fetchSubjectAndTopics();
    }
  }, [status, subjectId, router]);

  const fetchSubjectAndTopics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch subject info
      const subjectResponse = await fetch(`/api/subjects/${subjectId}`);
      if (!subjectResponse.ok) {
        if (subjectResponse.status === 404) {
          router.push('/subjects');
          return;
        }
        throw new Error('Failed to fetch subject');
      }
      
      const subject: ISubject = await subjectResponse.json();
      setSubjectInfo(subject);

      // Fetch topics for this subject
      const topicsResponse = await fetch(`/api/subjects/${subjectId}/topics`);
      if (!topicsResponse.ok) {
        throw new Error('Failed to fetch topics');
      }
      
      const topicsData: ITopic[] = await topicsResponse.json();
      
      // Transform topics to include UI enhancements
      const enhancedTopics: EnhancedTopic[] = topicsData.map(topic => ({
        _id: topic._id,
        name: topic.name,
        description: topic.description,
        longDescription: topic.longDescription,
        imageUrl: (topic as any).imageUrl,
        subjectId: topic.subjectId,
        order: topic.order,
        isUnlocked: topic.isUnlocked,
        difficulty: topic.difficulty,
        estimatedMinutes: topic.estimatedMinutes || 0,
        xpReward: topic.xpReward || 0,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
        progress: 0, // TODO: Calculate actual progress from user data
        contentCounts: (topic as any).contentCounts || {
          questions: 0,
          flashcards: 0,
          media: 0
        }
      }));
      
      setTopics(enhancedTopics);
    } catch (err) {
      console.error('Error fetching subject data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subject data');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100 border-green-200';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Advanced': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-blue-500 to-cyan-600';
    if (percentage >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-gray-400 to-gray-500';
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading subject...</p>
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
            <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Subject</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-x-4">
              <Button onClick={fetchSubjectAndTopics} variant="outline">
                Try Again
              </Button>
              <Button asChild>
                <Link href="/subjects">Back to Study Worlds</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subjectInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Subject not found</h2>
            <p className="mt-2 text-gray-600">The requested subject could not be found.</p>
            <Button asChild className="mt-4">
              <Link href="/subjects">Back to Study Worlds</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const completedTopics = topics.filter(t => t.progress === 100).length;
  const totalXP = topics.reduce((sum, t) => sum + (t.isUnlocked ? (t.xpReward || 0) : 0), 0);
  const totalTime = topics.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  return (
    <div className="min-h-screen">
      {/* Full-width Modern Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-80 overflow-hidden"
      >
          {/* Background Image or Gradient */}
          {subjectInfo.imageUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${subjectInfo.imageUrl})`
                }}
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80" />
            </>
          ) : (
            /* Fallback gradient background */
            <div className={`absolute inset-0 bg-gradient-to-br ${getSubjectColor(subjectInfo.name)}`} />
          )}

          {/* Subtle overlay patterns */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-60" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-40" />

        <div className="relative h-full flex flex-col justify-center px-4">
          <div className="max-w-6xl mx-auto w-full">
            <Link
              href="/subjects"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm mb-6 transition-all duration-300 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 hover:bg-white/15 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Study Worlds
            </Link>

            <div className="flex items-center space-x-6 mb-6">
              <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                {getSubjectIcon(subjectInfo.name)}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white">{subjectInfo.name}</h1>
                <p className="text-white/80 text-lg leading-relaxed">{subjectInfo.description}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-white" />
                  <span className="text-white/70 font-medium text-sm">Progress</span>
                </div>
                <div className="text-2xl font-bold text-white">{completedTopics}/{topics.length}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-white" />
                  <span className="text-white/70 font-medium text-sm">Total XP</span>
                </div>
                <div className="text-2xl font-bold text-white">{totalXP}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-white" />
                  <span className="text-white/70 font-medium text-sm">Est. Time</span>
                </div>
                <div className="text-2xl font-bold text-white">{totalTime}min</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-5 h-5 text-white" />
                  <span className="text-white/70 font-medium text-sm">Mastery</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Topics Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Learning Topics</h2>
            <div className="text-sm text-gray-500">
              {topics.filter(t => t.isUnlocked).length} / {topics.length} unlocked
            </div>
          </div>

          {topics.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 backdrop-blur-sm p-12 text-center"
            >
              <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-xl font-medium text-gray-800">No Topics Available</h3>
              <p className="mt-2 text-gray-600">Topics are being prepared for this subject.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {topics.map((topic, index) => (
                <motion.div
                  key={topic._id.toString()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <TopicCard topic={topic} subjectId={subjectId} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// Helper function to get topic color based on difficulty
const getTopicColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner': return 'from-emerald-500 to-green-600';
    case 'Intermediate': return 'from-amber-500 to-orange-600';
    case 'Advanced': return 'from-red-500 to-rose-600';
    default: return 'from-slate-500 to-gray-600';
  }
};

// Topic Card Component
function TopicCard({ topic, subjectId }: {
  topic: EnhancedTopic;
  subjectId: string;
}) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-emerald-700 bg-emerald-100/95 backdrop-blur-sm border-emerald-200';
      case 'Intermediate': return 'text-amber-700 bg-amber-100/95 backdrop-blur-sm border-amber-200';
      case 'Advanced': return 'text-red-700 bg-red-100/95 backdrop-blur-sm border-red-200';
      default: return 'text-slate-700 bg-slate-100/95 backdrop-blur-sm border-slate-200';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-emerald-400 to-green-500';
    if (percentage >= 60) return 'from-blue-400 to-cyan-500';
    if (percentage >= 40) return 'from-amber-400 to-orange-500';
    return 'from-slate-300 to-slate-400';
  };

  return (
    <Link href={topic.isUnlocked ? `/subjects/${subjectId}/topics/${topic._id}` : '#'}>
      <div className={`group relative overflow-hidden rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        topic.isUnlocked
          ? 'shadow-xl hover:shadow-2xl cursor-pointer border border-white/30'
          : 'opacity-75 border border-gray-300 cursor-not-allowed'
      }`}
           style={{ minHeight: '380px' }}>

        {/* Background Image or Gradient */}
        {topic.imageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-108"
              style={{
                backgroundImage: `url(${topic.imageUrl})`,
                filter: topic.isUnlocked ? 'none' : 'grayscale(100%)'
              }}
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80" />
          </>
        ) : (
          /* Fallback gradient background */
          <div className={`absolute inset-0 bg-gradient-to-br ${getTopicColor(topic.difficulty)}`} />
        )}

        {/* Subtle overlay patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-40" />

        {/* Additional dark overlay for gradient backgrounds */}
        {!topic.imageUrl && (
          <div className="absolute inset-0 bg-black/30" />
        )}

        {/* Lock Overlay */}
        {!topic.isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
            <div className="text-center text-white">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/20">
                <Lock className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold mb-1">Locked</h4>
              <p className="text-sm font-medium opacity-90">Complete Previous Topics</p>
              <p className="text-xs opacity-75 mt-2">Continue your learning path</p>
            </div>
          </div>
        )}

        <div className="relative z-10 p-6 h-full flex flex-col text-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${getDifficultyColor(topic.difficulty)}`}>
                {topic.difficulty}
              </div>
              <div className="flex items-center space-x-2 text-sm text-white/80">
                <Clock className="w-4 h-4" />
                <span>{topic.estimatedMinutes || 0}min</span>
              </div>
            </div>

            {topic.progress === 100 && (
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg border-2 border-yellow-300/50">
                  <Trophy className="w-5 h-5 text-yellow-900" />
                </div>
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div className="flex-1 mb-6">
            <h3 className="text-2xl font-bold mb-3 leading-tight drop-shadow-lg">{topic.name}</h3>
            <p className="text-white/90 text-sm leading-relaxed drop-shadow-sm" style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {topic.description}
            </p>
          </div>

          {/* Progress Section */}
          {topic.isUnlocked && (
            <div className="space-y-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="font-semibold text-white/90">Progress</span>
                  <span className="font-bold text-lg">{topic.progress}%</span>
                </div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topic.progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                    className={`h-full bg-gradient-to-r ${getProgressColor(topic.progress)} rounded-full shadow-sm`}
                  />
                </div>
              </div>

              {/* Content Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                  <FileText className="w-4 h-4" />
                  <span className="font-semibold">{topic.contentCounts.questions} Questions</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-semibold">{topic.contentCounts.flashcards} Cards</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                  <Play className="w-4 h-4" />
                  <span className="font-semibold">{topic.contentCounts.media} Media</span>
                </div>
              </div>

              {/* XP Reward and Action Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                  <Zap className="w-4 h-4" />
                  <span className="font-semibold text-sm">+{topic.xpReward || 0} XP</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 text-center font-bold hover:bg-white/30 transition-all duration-300 shadow-lg text-sm">
                  <span className="flex items-center space-x-2">
                    <span>Start Learning</span>
                    <Target className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}