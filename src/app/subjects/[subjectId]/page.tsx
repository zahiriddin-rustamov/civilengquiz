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
import { Subject, Topic } from '@/models';

// Mock data for topics - in real app, this would come from API
const MOCK_TOPICS: Record<string, (Topic & {
  progress: number;
  isUnlocked: boolean;
  contentTypes: {
    questions: number;
    flashcards: number;
    media: number;
  };
  estimatedTime: number; // in minutes
  xpReward: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
})[]> = {
  '1': [ // Concrete Technology
    {
      id: 'ct-1',
      name: 'Fresh Concrete',
      description: 'Learn about the properties and behavior of concrete in its plastic state.',
      order: 1,
      subjectId: '1',
      content: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      isUnlocked: true,
      contentTypes: { questions: 15, flashcards: 8, media: 3 },
      estimatedTime: 45,
      xpReward: 150,
      difficulty: 'Beginner',
    },
    {
      id: 'ct-2',
      name: 'Hardened Concrete',
      description: 'Understand the properties of concrete after it has set and hardened.',
      order: 2,
      subjectId: '1',
      content: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      isUnlocked: true,
      contentTypes: { questions: 20, flashcards: 12, media: 4 },
      estimatedTime: 60,
      xpReward: 200,
      difficulty: 'Intermediate',
    },
    {
      id: 'ct-3',
      name: 'Concrete Mix Design',
      description: 'Master the art of designing concrete mixes for specific applications.',
      order: 3,
      subjectId: '1',
      content: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      isUnlocked: false,
      contentTypes: { questions: 25, flashcards: 15, media: 6 },
      estimatedTime: 90,
      xpReward: 300,
      difficulty: 'Advanced',
    },
  ],
  '2': [ // Environmental Engineering
    {
      id: 'ee-1',
      name: 'Water Quality',
      description: 'Study water quality parameters and assessment methods.',
      order: 1,
      subjectId: '2',
      content: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      isUnlocked: true,
      contentTypes: { questions: 18, flashcards: 10, media: 5 },
      estimatedTime: 50,
      xpReward: 180,
      difficulty: 'Beginner',
    },
    {
      id: 'ee-2',
      name: 'Air Pollution Control',
      description: 'Learn about air pollution sources and control technologies.',
      order: 2,
      subjectId: '2',
      content: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      isUnlocked: true,
      contentTypes: { questions: 22, flashcards: 14, media: 7 },
      estimatedTime: 70,
      xpReward: 250,
      difficulty: 'Intermediate',
    },
  ],
  '3': [ // Water Resources
    {
      id: 'wr-1',
      name: 'Hydrology Basics',
      description: 'Understand the water cycle and hydrological processes.',
      order: 1,
      subjectId: '3',
      content: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      isUnlocked: false,
      contentTypes: { questions: 20, flashcards: 12, media: 8 },
      estimatedTime: 80,
      xpReward: 280,
      difficulty: 'Advanced',
    },
  ],
};

const SUBJECT_INFO: Record<string, {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  isUnlocked: boolean;
}> = {
  '1': {
    name: 'Concrete Technology',
    description: 'Master the art of concrete design, mixing, and testing',
    icon: <Building2 className="w-8 h-8" />,
    color: 'from-blue-500 to-cyan-600',
    isUnlocked: true,
  },
  '2': {
    name: 'Environmental Engineering',
    description: 'Explore sustainable solutions for environmental challenges',
    icon: <Globe className="w-8 h-8" />,
    color: 'from-green-500 to-emerald-600',
    isUnlocked: true,
  },
  '3': {
    name: 'Water Resources',
    description: 'Command the flow of water systems and hydraulic engineering',
    icon: <Droplets className="w-8 h-8" />,
    color: 'from-indigo-500 to-purple-600',
    isUnlocked: false,
  },
};

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [topics, setTopics] = useState<typeof MOCK_TOPICS[string]>([]);
  const [subjectInfo, setSubjectInfo] = useState<typeof SUBJECT_INFO[string] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const subjectId = params.subjectId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && subjectId) {
      // TODO: In real app, fetch from API
      const mockTopics = MOCK_TOPICS[subjectId] || [];
      const mockSubjectInfo = SUBJECT_INFO[subjectId];
      
      if (!mockSubjectInfo) {
        router.push('/subjects');
        return;
      }

      setTopics(mockTopics);
      setSubjectInfo(mockSubjectInfo);
      setIsLoading(false);
    }
  }, [status, subjectId, router]);

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
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading topics...</p>
        </div>
      </div>
    );
  }

  if (!subjectInfo) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Subject not found</h2>
          <p className="mt-2 text-gray-600">The requested subject could not be found.</p>
          <Button asChild className="mt-4">
            <Link href="/subjects">Back to Study Worlds</Link>
          </Button>
        </div>
      </div>
    );
  }

  const completedTopics = topics.filter(t => t.progress === 100).length;
  const totalXP = topics.reduce((sum, t) => sum + (t.isUnlocked ? t.xpReward : 0), 0);
  const totalTime = topics.reduce((sum, t) => sum + t.estimatedTime, 0);

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
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${subjectInfo.color} p-8 text-white shadow-xl mb-8`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
          </div>

          <div className="relative">
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex-shrink-0 w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                {subjectInfo.icon}
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
                  key={topic.id}
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
  topic: typeof MOCK_TOPICS[string][0]; 
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
          href={topic.isUnlocked ? `/subjects/${subjectId}/topics/${topic.id}` : '#'}
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
              <span>{topic.estimatedTime}min</span>
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
            href={`/subjects/${subjectId}/topics/${topic.id}/questions`}
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
            href={`/subjects/${subjectId}/topics/${topic.id}/flashcards`}
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
            href={`/subjects/${subjectId}/topics/${topic.id}/media`}
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
                <Link href={`/subjects/${subjectId}/topics/${topic.id}`}>
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