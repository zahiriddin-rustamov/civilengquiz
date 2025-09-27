'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
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
        topicsCount: (subject as any).topicCount || 0, // Use actual topic count from API
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
                <WorldCard world={world} />
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
    <Link href={world.isUnlocked ? `/subjects/${world._id}` : '#'}>
      <div className={`group relative overflow-hidden rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        world.isUnlocked
          ? 'shadow-xl hover:shadow-2xl cursor-pointer border border-white/30'
          : 'opacity-75 border border-gray-300 cursor-not-allowed'
      }`}
           style={{ minHeight: '320px' }}>

        {/* Background Image or Gradient */}
        {world.imageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-108"
              style={{
                backgroundImage: `url(${world.imageUrl})`,
                filter: world.isUnlocked ? 'none' : 'grayscale(100%)'
              }}
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80 transition-opacity duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]" />
          </>
        ) : (
          /* Fallback gradient background */
          <div className={`absolute inset-0 bg-gradient-to-br ${world.isUnlocked ? world.color : 'from-gray-400 to-gray-500'}`} />
        )}

        {/* Subtle overlay patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-60 transition-opacity duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-40 transition-opacity duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]" />

        {/* Lock Overlay */}
        {!world.isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
            <div className="text-center text-white">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/20">
                <Lock className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold mb-1">Locked</h4>
              <p className="text-sm font-medium opacity-90">Complete Previous Worlds</p>
              <p className="text-xs opacity-75 mt-2">Continue your learning journey</p>
            </div>
          </div>
        )}

        <div className="relative z-10 p-6 h-full flex flex-col text-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                {world.icon}
              </div>
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${getDifficultyColor(world.difficulty)}`}>
                {world.difficulty}
              </div>
            </div>

            {world.progress === 100 && (
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg border-2 border-yellow-300/50">
                  <Trophy className="w-6 h-6 text-yellow-900" />
                </div>
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div className="flex-1 space-y-3">
            <h3 className="text-2xl font-bold leading-tight drop-shadow-lg">{world.name}</h3>
            <div className="text-white/90 text-sm leading-relaxed drop-shadow-sm prose prose-sm prose-invert max-w-none [&>*]:!text-white/90" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              <ReactMarkdown>{world.description}</ReactMarkdown>
            </div>
          </div>

          {/* Progress Section */}
          {world.isUnlocked && (
            <div className="mt-6 space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="font-semibold text-white/90">Progress</span>
                  <span className="font-bold text-lg">{world.progress}%</span>
                </div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${world.progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                    className={`h-full bg-gradient-to-r ${getProgressColor(world.progress)} rounded-full shadow-sm`}
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-semibold">{world.topicsCount} Topics</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                  <Zap className="w-4 h-4" />
                  <span className="font-semibold">500 XP</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <div className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-center font-bold hover:bg-white/30 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-lg hover:shadow-xl">
                  <span className="flex items-center justify-center space-x-2">
                    <span>Enter World</span>
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