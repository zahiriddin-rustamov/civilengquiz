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

// Mock data for topic details - in real app, this would come from API
const MOCK_TOPIC_DATA: Record<string, Record<string, {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  subjectName: string;
  progress: number;
  isUnlocked: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: number;
  xpReward: number;
  contentTypes: {
    questions: {
      count: number;
      completed: number;
      averageScore: number;
      bestScore: number;
      timeSpent: number; // in minutes
    };
    flashcards: {
      count: number;
      completed: number;
      mastered: number;
      timeSpent: number;
    };
    media: {
      count: number;
      completed: number;
      totalDuration: number; // in minutes
      timeSpent: number;
    };
  };
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
}>> = {
  '1': { // Concrete Technology
    'ct-1': {
      id: 'ct-1',
      name: 'Fresh Concrete',
      description: 'Learn about the properties and behavior of concrete in its plastic state.',
      longDescription: 'Dive deep into the fascinating world of fresh concrete! Master the fundamental properties that determine workability, understand the science behind slump tests, and discover how different additives affect concrete behavior. This foundational topic will prepare you for advanced concrete technology concepts.',
      subjectName: 'Concrete Technology',
      progress: 65,
      isUnlocked: true,
      difficulty: 'Beginner',
      estimatedTime: 45,
      xpReward: 150,
      contentTypes: {
        questions: {
          count: 15,
          completed: 10,
          averageScore: 78,
          bestScore: 92,
          timeSpent: 25
        },
        flashcards: {
          count: 8,
          completed: 5,
          mastered: 3,
          timeSpent: 15
        },
        media: {
          count: 3,
          completed: 2,
          totalDuration: 18,
          timeSpent: 12
        }
      },
      achievements: [
        {
          id: 'first-quiz',
          name: 'First Steps',
          description: 'Complete your first quiz',
          icon: <Trophy className="w-5 h-5" />,
          unlocked: true,
          rarity: 'Common'
        },
        {
          id: 'perfect-score',
          name: 'Perfectionist',
          description: 'Score 100% on a quiz',
          icon: <Star className="w-5 h-5" />,
          unlocked: false,
          rarity: 'Rare'
        }
      ],
      streakDays: 3,
      lastAccessed: new Date()
    },
    'ct-2': {
      id: 'ct-2',
      name: 'Hardened Concrete',
      description: 'Understand the properties of concrete after it has set and hardened.',
      longDescription: 'Explore the transformation of concrete from plastic to hardened state. Learn about compressive strength, durability factors, and testing methods that ensure structural integrity.',
      subjectName: 'Concrete Technology',
      progress: 0,
      isUnlocked: true,
      difficulty: 'Intermediate',
      estimatedTime: 60,
      xpReward: 200,
      contentTypes: {
        questions: { count: 20, completed: 0, averageScore: 0, bestScore: 0, timeSpent: 0 },
        flashcards: { count: 12, completed: 0, mastered: 0, timeSpent: 0 },
        media: { count: 4, completed: 0, totalDuration: 25, timeSpent: 0 }
      },
      achievements: [],
      streakDays: 0,
      lastAccessed: new Date()
    }
  },
  '2': { // Environmental Engineering
    'ee-1': {
      id: 'ee-1',
      name: 'Water Quality',
      description: 'Study water quality parameters and assessment methods.',
      longDescription: 'Master the essential parameters that define water quality and learn the scientific methods used to assess and monitor water systems for environmental protection.',
      subjectName: 'Environmental Engineering',
      progress: 0,
      isUnlocked: true,
      difficulty: 'Beginner',
      estimatedTime: 50,
      xpReward: 180,
      contentTypes: {
        questions: { count: 18, completed: 0, averageScore: 0, bestScore: 0, timeSpent: 0 },
        flashcards: { count: 10, completed: 0, mastered: 0, timeSpent: 0 },
        media: { count: 5, completed: 0, totalDuration: 30, timeSpent: 0 }
      },
      achievements: [],
      streakDays: 0,
      lastAccessed: new Date()
    }
  }
};

export default function TopicOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [topicData, setTopicData] = useState<typeof MOCK_TOPIC_DATA[string][string] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const subjectId = params.subjectId as string;
  const topicId = params.topicId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && subjectId && topicId) {
      // TODO: In real app, fetch from API
      const mockData = MOCK_TOPIC_DATA[subjectId]?.[topicId];
      
      if (!mockData) {
        router.push(`/subjects/${subjectId}`);
        return;
      }

      setTopicData(mockData);
      setIsLoading(false);
    }
  }, [status, subjectId, topicId, router]);

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
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading topic...</p>
        </div>
      </div>
    );
  }

  if (!topicData) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Topic not found</h2>
          <p className="mt-2 text-gray-600">The requested topic could not be found.</p>
          <Button asChild className="mt-4">
            <Link href={`/subjects/${subjectId}`}>Back to Subject</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalContentItems = topicData.contentTypes.questions.count + 
                           topicData.contentTypes.flashcards.count + 
                           topicData.contentTypes.media.count;
  
  const completedContentItems = topicData.contentTypes.questions.completed + 
                               topicData.contentTypes.flashcards.completed + 
                               topicData.contentTypes.media.completed;

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
            <Link href={`/subjects/${subjectId}`} className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {topicData.subjectName}</span>
            </Link>
          </Button>
        </motion.div>

        {/* Topic Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 p-8 text-white shadow-xl mb-8"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
          </div>

          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <h1 className="text-3xl font-bold">{topicData.name}</h1>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(topicData.difficulty)}`}>
                    {topicData.difficulty}
                  </div>
                  {topicData.streakDays > 0 && (
                    <div className="flex items-center space-x-1 bg-orange-500/20 px-3 py-1 rounded-full">
                      <Flame className="w-4 h-4 text-orange-300" />
                      <span className="text-sm font-medium">{topicData.streakDays} day streak</span>
                    </div>
                  )}
                </div>
                <p className="text-white/90 text-lg mb-4">{topicData.description}</p>
                <p className="text-white/80 text-sm leading-relaxed">{topicData.longDescription}</p>
              </div>
            </div>

            {/* Progress Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white/80">Overall Progress</span>
                <span className="font-bold text-xl">{topicData.progress}%</span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${topicData.progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${getProgressColor(topicData.progress)} rounded-full`}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5" />
                  <span className="text-white/80">Completed</span>
                </div>
                <div className="text-2xl font-bold">{completedContentItems}/{totalContentItems}</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5" />
                  <span className="text-white/80">XP Reward</span>
                </div>
                <div className="text-2xl font-bold">{topicData.xpReward}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-white/80">Est. Time</span>
                </div>
                <div className="text-2xl font-bold">{topicData.estimatedTime}min</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-5 h-5" />
                  <span className="text-white/80">Achievements</span>
                </div>
                <div className="text-2xl font-bold">
                  {topicData.achievements.filter(a => a.unlocked).length}/{topicData.achievements.length}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Content Types Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose Your Learning Path</h2>
            
            <div className="grid gap-6">
              {/* Questions Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Link href={topicData.isUnlocked ? `/subjects/${subjectId}/topics/${topicId}/questions` : '#'}>
                  <ContentTypeCard
                    type="questions"
                    title="Interactive Questions"
                    description="Test your knowledge with quizzes and practice problems"
                    icon={<FileText className="w-8 h-8" />}
                    color="from-blue-400 to-blue-500"
                    data={topicData.contentTypes.questions}
                    href={`/subjects/${subjectId}/topics/${topicId}/questions`}
                    isUnlocked={topicData.isUnlocked}
                  />
                </Link>
              </motion.div>

              {/* Flashcards Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link href={topicData.isUnlocked ? `/subjects/${subjectId}/topics/${topicId}/flashcards` : '#'}>
                  <ContentTypeCard
                    type="flashcards"
                    title="Study Flashcards"
                    description="Memorize key concepts with spaced repetition"
                    icon={<BookOpen className="w-8 h-8" />}
                    color="from-emerald-400 to-emerald-500"
                    data={topicData.contentTypes.flashcards}
                    href={`/subjects/${subjectId}/topics/${topicId}/flashcards`}
                    isUnlocked={topicData.isUnlocked}
                  />
                </Link>
              </motion.div>

              {/* Media Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link href={topicData.isUnlocked ? `/subjects/${subjectId}/topics/${topicId}/media` : '#'}>
                  <ContentTypeCard
                    type="media"
                    title="Learning Media"
                    description="Watch videos and explore interactive content"
                    icon={<Play className="w-8 h-8" />}
                    color="from-indigo-400 to-indigo-500"
                    data={topicData.contentTypes.media}
                    href={`/subjects/${subjectId}/topics/${topicId}/media`}
                    isUnlocked={topicData.isUnlocked}
                  />
                </Link>
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
  isUnlocked 
}: {
  type: 'questions' | 'flashcards' | 'media';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  data: any;
  href: string;
  isUnlocked: boolean;
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

  const CardContent = () => (
    <div className={`relative overflow-hidden rounded-xl border-2 bg-gradient-to-br ${color} p-6 text-white shadow-lg transition-all duration-300 ${
      isUnlocked ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : 'opacity-75 cursor-not-allowed'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
      </div>

      {/* Lock Overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
          <div className="text-center text-white">
            <Lock className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Complete previous topics</p>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              {icon}
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">{title}</h3>
              <p className="text-white/90 text-sm">{description}</p>
            </div>
          </div>
          
          {completionPercentage === 100 && (
            <Trophy className="w-6 h-6 text-yellow-300" />
          )}
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 text-center">
            <div className="font-bold text-lg">{data.count}</div>
            <div className="text-white/80">Total</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 text-center">
            <div className="font-bold text-lg">
              {type === 'flashcards' ? data.mastered : data.completed}
            </div>
            <div className="text-white/80">
              {type === 'flashcards' ? 'Mastered' : 'Completed'}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 text-center">
            <div className="font-bold text-lg">{data.timeSpent}m</div>
            <div className="text-white/80">Time Spent</div>
          </div>
        </div>

        {/* Action Button */}
        {isUnlocked && (
          <div className="mt-4">
            <div className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-center font-medium hover:bg-white/30 transition-colors">
              {completionPercentage === 0 ? 'Start Learning' : 'Continue Learning'}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return isUnlocked ? (
    <Link href={href}>
      <CardContent />
    </Link>
  ) : (
    <CardContent />
  );
} 