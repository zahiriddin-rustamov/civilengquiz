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
  subjectId: any;
  order: number;
  isUnlocked: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
  progress: number;
  contentTypes: {
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
        subjectId: topic.subjectId,
        order: topic.order,
        isUnlocked: topic.isUnlocked,
        difficulty: topic.difficulty,
        estimatedMinutes: topic.estimatedMinutes,
        xpReward: topic.xpReward,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
        progress: 0, // TODO: Calculate actual progress from user data
        contentTypes: {
          questions: 0, // TODO: Fetch actual counts
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
  const totalXP = topics.reduce((sum, t) => sum + (t.isUnlocked ? t.xpReward : 0), 0);
  const totalTime = topics.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-800">
            <Link href="/subjects" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Study Worlds</span>
            </Link>
          </Button>
        </motion.div>

        {/* Subject Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getSubjectColor(subjectInfo.name)} p-8 text-white shadow-xl mb-8`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
          </div>

          <div className="relative">
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex-shrink-0 w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                {getSubjectIcon(subjectInfo.name)}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{subjectInfo.name}</h1>
                <p className="text-white/90 text-lg">{subjectInfo.description}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5" />
                  <span className="text-white/80">Progress</span>
                </div>
                <div className="text-2xl font-bold">{completedTopics}/{topics.length}</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5" />
                  <span className="text-white/80">Total XP</span>
                </div>
                <div className="text-2xl font-bold">{totalXP}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-white/80">Est. Time</span>
                </div>
                <div className="text-2xl font-bold">{Math.round(totalTime / 60)}h</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-5 h-5" />
                  <span className="text-white/80">Mastery</span>
                </div>
                <div className="text-2xl font-bold">
                  {topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </motion.div>

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
            <div className="grid gap-6">
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
  );
}

// Topic Card Component
function TopicCard({ topic, subjectId }: { 
  topic: EnhancedTopic; 
  subjectId: string;
}) {
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

  return (
    <div className={`group relative overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all duration-300 ${
      topic.isUnlocked 
        ? 'border-gray-200 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-300' 
        : 'border-gray-200 opacity-75'
    }`}>
      {/* Lock Overlay */}
      {!topic.isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm z-10">
          <div className="text-center text-gray-600">
            <Lock className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Complete previous topics</p>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header - Now clickable to go to topic overview */}
        <Link 
          href={topic.isUnlocked ? `/subjects/${subjectId}/topics/${topic._id}` : '#'}
          className={`block ${topic.isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className={`text-xl font-bold transition-colors ${
                  topic.isUnlocked 
                    ? 'text-gray-800 group-hover:text-indigo-600' 
                    : 'text-gray-800'
                }`}>
                  {topic.name}
                </h3>
                {topic.progress === 100 && (
                  <Trophy className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <p className="text-gray-600 mb-3">{topic.description}</p>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(topic.difficulty)}`}>
                {topic.difficulty}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{topic.estimatedMinutes}min</span>
            </div>
          </div>
        </Link>

        {/* Progress Bar */}
        {topic.isUnlocked && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-800">{topic.progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${topic.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${getProgressColor(topic.progress)} rounded-full`}
              />
            </div>
          </div>
        )}

        {/* Content Types */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Link 
            href={`/subjects/${subjectId}/topics/${topic._id}/questions`}
            className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
              topic.isUnlocked 
                ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FileText className="w-6 h-6 mb-2" />
            <span className="text-xs font-medium">Questions</span>
            <span className="text-xs">{topic.contentTypes.questions}</span>
          </Link>

          <Link 
            href={`/subjects/${subjectId}/topics/${topic._id}/flashcards`}
            className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
              topic.isUnlocked 
                ? 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <BookOpen className="w-6 h-6 mb-2" />
            <span className="text-xs font-medium">Flashcards</span>
            <span className="text-xs">{topic.contentTypes.flashcards}</span>
          </Link>

          <Link 
            href={`/subjects/${subjectId}/topics/${topic._id}/media`}
            className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
              topic.isUnlocked 
                ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-6 h-6 mb-2" />
            <span className="text-xs font-medium">Media</span>
            <span className="text-xs">{topic.contentTypes.media}</span>
          </Link>
        </div>

        {/* XP Reward and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>+{topic.xpReward} XP</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {topic.isUnlocked && (
              <div className="flex items-center space-x-1 text-sm">
                {topic.progress === 100 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-gray-600">
                  {topic.progress === 100 ? 'Completed' : 'In Progress'}
                </span>
              </div>
            )}
            
            {/* View Overview Button */}
            {topic.isUnlocked && (
              <Button 
                asChild
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-sm"
              >
                <Link href={`/subjects/${subjectId}/topics/${topic._id}`}>
                  <Target className="w-4 h-4 mr-1" />
                  Overview
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 