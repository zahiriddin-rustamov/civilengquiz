'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Lock, 
  Star, 
  Trophy,
  Zap,
  Target,
  Globe,
  Droplets,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ISubject } from '@/models/database';

// Enhanced subject type for UI
interface EnhancedSubject extends ISubject {
  icon: React.ReactNode;
  color: string;
  progress: number;
  topicsCount: number;
}

// Subject icon mapping
const getSubjectIcon = (name: string) => {
  switch (name) {
    case 'Concrete Technology':
      return <Building2 className="w-8 h-8" />;
    case 'Environmental Engineering':
      return <Globe className="w-8 h-8" />;
    case 'Water Resources':
      return <Droplets className="w-8 h-8" />;
    default:
      return <BookOpen className="w-8 h-8" />;
  }
};

// Subject color mapping
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

export default function StudyWorldsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [studyWorlds, setStudyWorlds] = useState<EnhancedSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchSubjects();
    }
  }, [status, router]);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/subjects');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      
      const subjects: ISubject[] = await response.json();
      
      // Transform subjects to include UI enhancements
      const enhancedSubjects: EnhancedSubject[] = subjects.map(subject => ({
        ...subject,
        icon: getSubjectIcon(subject.name),
        color: getSubjectColor(subject.name),
        progress: 0, // TODO: Calculate actual progress from user data
        topicsCount: 0, // TODO: Fetch actual topic count
      }));
      
      setStudyWorlds(enhancedSubjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
            <p className="mt-4 text-gray-600">Loading Study Worlds...</p>
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
            <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Subjects</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchSubjects} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Study Worlds
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Embark on your learning adventure across different engineering realms
            </p>
          </div>
          
          {/* Stats Bar */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-8 rounded-full bg-white/80 backdrop-blur-sm px-8 py-4 shadow-lg border border-white/20">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">
                  {studyWorlds.filter(w => w.isUnlocked).length} / {studyWorlds.length} Unlocked
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">
                  {studyWorlds.reduce((sum, w) => sum + (w.isUnlocked ? w.xpReward : 0), 0)} XP Available
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  {studyWorlds.reduce((sum, w) => sum + w.topicsCount, 0)} Total Topics
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Admin Button */}
        {session?.user?.role === 'admin' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 flex justify-end"
          >
            <Button 
              asChild
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            >
              <Link href="/admin/subjects/new">
                <Star className="w-4 h-4 mr-2" />
                Add New World
              </Link>
            </Button>
          </motion.div>
        )}

        {/* Study Worlds Grid */}
        {studyWorlds.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 backdrop-blur-sm p-12 text-center"
          >
            <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-xl font-medium text-gray-800">No Study Worlds Available</h3>
            <p className="mt-2 text-gray-600">New adventures are being prepared. Check back soon!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {studyWorlds.map((world, index) => (
              <motion.div
                key={world._id.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                {world.isUnlocked ? (
                  <Link href={`/subjects/${world._id}`}>
                    <WorldCard world={world} />
                  </Link>
                ) : (
                  <WorldCard world={world} />
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Legend */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center space-x-6 rounded-full bg-white/60 backdrop-blur-sm px-6 py-3 text-sm text-gray-600 shadow-sm border border-white/20">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600"></div>
              <span>Mastered (80%+)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600"></div>
              <span>Proficient (60%+)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600"></div>
              <span>Learning (40%+)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-400 to-gray-500"></div>
              <span>Beginner</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// World Card Component
function WorldCard({ world }: { world: EnhancedSubject }) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-blue-500 to-cyan-600';
    if (percentage >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-gray-400 to-gray-500';
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
      world.isUnlocked 
        ? `bg-gradient-to-br ${world.color} border-white/20 shadow-xl hover:shadow-2xl hover:-translate-y-2 cursor-pointer` 
        : 'bg-gradient-to-br from-gray-400 to-gray-500 border-gray-300 opacity-75'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
      </div>

      {/* Lock Overlay */}
      {!world.isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
          <div className="text-center text-white">
            <Lock className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm font-medium">Complete previous worlds</p>
          </div>
        </div>
      )}

      <div className="relative p-8 text-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              {world.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">{world.name}</h3>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(world.difficulty)}`}>
                {world.difficulty}
              </div>
            </div>
          </div>
          
          {world.progress === 100 && (
            <Trophy className="w-6 h-6 text-yellow-300" />
          )}
        </div>

        {/* Description */}
        <p className="text-white/90 text-sm mb-6 leading-relaxed">
          {world.description}
        </p>

        {/* Stats */}
        <div className="space-y-4">
          {/* Progress Bar */}
          {world.isUnlocked && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/80">Progress</span>
                <span className="font-medium">{world.progress}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${world.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${getProgressColor(world.progress)} rounded-full`}
                />
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="flex items-center space-x-2 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-white/80">Topics</span>
              </div>
              <div className="font-bold text-lg">{world.topicsCount}</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="flex items-center space-x-2 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-white/80">XP Reward</span>
              </div>
              <div className="font-bold text-lg">{world.xpReward}</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {world.isUnlocked && (
          <div className="mt-6">
            <div className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-center font-medium hover:bg-white/30 transition-colors">
              Enter World
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 