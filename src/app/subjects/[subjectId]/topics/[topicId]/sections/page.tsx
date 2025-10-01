'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  PlayCircle,
  Lock,
  CheckCircle,
  Clock,
  Zap,
  Trophy,
  Star,
  Target,
  BookOpen,
  FileText} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Section {
  id: string;
  name: string;
  description?: string;
  order: number;
  questionCount: number;
  totalXP: number;
  estimatedTime: number;
}

interface TopicData {
  topicName: string;
  subjectName: string;
  imageUrl?: string;
  sections: Section[];
  sectionSettings: {
    unlockConditions: 'always' | 'sequential' | 'score-based';
    requiredScore: number;
    requireCompletion: boolean;
  };
  totalXP: number;
  estimatedTime: number;
}

interface SectionProgress {
  sectionId: string;
  completed: boolean;
  score: number;
  questionsAnswered: number;
  totalQuestions: number;
}

export default function SectionsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [topicData, setTopicData] = useState<TopicData | null>(null);
  const [sectionProgress, setSectionProgress] = useState<SectionProgress[]>([]);
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
      fetchTopicSections();
      fetchSectionProgress();
    }
  }, [status, subjectId, topicId, router]);

  const fetchTopicSections = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/topics/${topicId}/questions`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push(`/subjects/${subjectId}/topics/${topicId}`);
          return;
        }
        throw new Error('Failed to fetch sections');
      }

      const data = await response.json();
      setTopicData(data);
    } catch (err) {
      console.error('Error fetching sections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sections');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSectionProgress = async () => {
    try {
      const response = await fetch(`/api/user/progress/sections?topicId=${topicId}`);
      if (response.ok) {
        const progress = await response.json();
        setSectionProgress(progress);
      }
    } catch (err) {
      console.error('Error fetching section progress:', err);
    }
  };

  const getSectionProgress = (sectionId: string): SectionProgress | null => {
    return sectionProgress.find(p => p.sectionId === sectionId) || null;
  };

  const isSectionUnlocked = (section: Section, index: number): boolean => {
    if (!topicData?.sectionSettings) return true;

    const settings = topicData.sectionSettings;

    if (settings.unlockConditions === 'always') {
      return true;
    }

    if (settings.unlockConditions === 'sequential') {
      // If this section was already completed, keep it unlocked
      const currentProgress = getSectionProgress(section.id);
      if (currentProgress && currentProgress.completed) {
        return true;
      }

      // Check if all previous sections are completed
      for (let i = 0; i < index; i++) {
        const prevSection = topicData!.sections[i];
        const prevProgress = getSectionProgress(prevSection.id);
        if (!prevProgress || !prevProgress.completed) {
          return false;
        }
      }
      return true;
    }

    if (settings.unlockConditions === 'score-based') {
      // Check if previous section meets score requirement
      if (index === 0) return true;

      // If this section was already completed, keep it unlocked
      const currentProgress = getSectionProgress(section.id);
      if (currentProgress && currentProgress.completed) {
        return true;
      }

      const prevSection = topicData!.sections[index - 1];
      const prevProgress = getSectionProgress(prevSection.id);
      const requiredScore = settings.requiredScore || 70;

      return prevProgress && prevProgress.score >= requiredScore;
    }

    return false;
  };

  const getUnlockMessage = (section: Section, index: number): string => {
    if (!topicData?.sectionSettings) return '';

    const settings = topicData.sectionSettings;

    if (settings.unlockConditions === 'sequential') {
      for (let i = 0; i < index; i++) {
        const prevSection = topicData!.sections[i];
        const prevProgress = getSectionProgress(prevSection.id);
        if (!prevProgress || !prevProgress.completed) {
          return `Complete "${prevSection.name}" first`;
        }
      }
    }

    if (settings.unlockConditions === 'score-based' && index > 0) {
      const prevSection = topicData!.sections[index - 1];
      const prevProgress = getSectionProgress(prevSection.id);
      const requiredScore = settings.requiredScore || 70;

      if (!prevProgress || prevProgress.score < requiredScore) {
        return `Score at least ${requiredScore}% in "${prevSection.name}"`;
      }
    }

    return '';
  };

  const getVisibleSections = (): Section[] => {
    if (!topicData || topicData.sections.length === 0) return [];

    // Always show all sections that have questions
    return topicData.sections.filter(section => section.questionCount > 0);
  };

  const handleSectionClick = (sectionId: string) => {
    // Find the section and check if it's unlocked
    const section = visibleSections.find(s => s.id === sectionId);
    if (!section) return;

    const sectionIndex = topicData!.sections.findIndex(s => s.id === sectionId);
    const isUnlocked = isSectionUnlocked(section, sectionIndex);

    if (isUnlocked) {
      router.push(`/subjects/${subjectId}/topics/${topicId}/sections/${sectionId}/questions`);
    }
    // If locked, the card onClick already prevents navigation with the isUnlocked check
    // and the UI shows the lock state visually
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Sections</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchTopicSections} variant="outline">
              Try Again
            </Button>
            <Button asChild>
              <Link href={`/subjects/${subjectId}/topics/${topicId}`}>Back to Topic</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!topicData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No sections found</p>
          <Button asChild className="mt-4">
            <Link href={`/subjects/${subjectId}/topics/${topicId}`}>Back to Topic</Link>
          </Button>
        </div>
      </div>
    );
  }

  const visibleSections = getVisibleSections();

  // Calculate collected XP from completed sections
  const collectedXP = visibleSections.reduce((total, section) => {
    const progress = getSectionProgress(section.id);
    if (progress?.completed) {
      return total + section.totalXP;
    }
    return total;
  }, 0);

  return (
    <div className="min-h-screen">
      {/* Modern Banner */}
      <div className="relative h-80 overflow-hidden">
        {topicData.imageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${topicData.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800" />
        )}

        <div className="relative h-full flex flex-col justify-center px-4">
          <div className="max-w-6xl mx-auto w-full">
            <Link
              href={`/subjects/${subjectId}/topics/${topicId}`}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm mb-6 transition-all duration-300 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 hover:bg-white/15 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {topicData.topicName}
            </Link>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-8 items-center">
              {/* Left Column - Title */}
              <div className="lg:col-span-2">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Question Sections</h1>
                <p className="text-white/80 text-lg mb-4">{topicData.subjectName} → {topicData.topicName}</p>

                {/* Progress indicator */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/90 font-medium text-sm">Sections Progress</span>
                    <span className="font-bold text-white">{sectionProgress.filter(p => p.completed).length}/{visibleSections.length}</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${visibleSections.length > 0 ? (sectionProgress.filter(p => p.completed).length / visibleSections.length) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Key Stats */}
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Zap className="w-4 h-4 text-white" />
                    <span className="text-white/70 font-medium text-xs">Collected XP</span>
                  </div>
                  <div className="text-xl font-bold text-white">{collectedXP} / {topicData.totalXP}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                    <Trophy className="w-4 h-4 text-white mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{sectionProgress.filter(p => p.completed).length}</div>
                    <div className="text-white/70 text-xs">Done</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                    <Target className="w-4 h-4 text-white mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{visibleSections.length}</div>
                    <div className="text-white/70 text-xs">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Sections Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleSections.map((section, visibleIndex) => {
            const progress = getSectionProgress(section.id);
            // Find the original index in the full sections array
            const originalIndex = topicData!.sections.findIndex(s => s.id === section.id);
            const isUnlocked = isSectionUnlocked(section, originalIndex);
            const unlockMessage = getUnlockMessage(section, originalIndex);

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: visibleIndex * 0.1 }}
              >
                <Card
                  className={`h-full transition-all duration-200 hover:shadow-lg cursor-pointer ${
                    isUnlocked
                      ? 'hover:scale-105 border-indigo-200'
                      : 'opacity-60 cursor-not-allowed border-gray-200'
                  } ${progress?.completed ? 'bg-green-50 border-green-200' : ''}`}
                  onClick={() => isUnlocked && handleSectionClick(section.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Section {section.order}
                          </Badge>
                          {progress?.completed && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {!isUnlocked && (
                            <Lock className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <CardTitle className="text-lg leading-tight">
                          {section.name}
                        </CardTitle>
                        {section.description && (
                          <CardDescription className="mt-1 text-sm">
                            {section.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Progress Bar */}
                      {progress && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{Math.round((progress.questionsAnswered / progress.totalQuestions) * 100)}%</span>
                          </div>
                          <Progress
                            value={(progress.questionsAnswered / progress.totalQuestions) * 100}
                            className="h-2"
                          />
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-gray-500" />
                          <span>{section.questionCount} questions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{section.estimatedTime} min</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span>{section.totalXP} XP</span>
                        </div>
                        {progress && (
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4 text-blue-500" />
                            <span>{progress.score}% score</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        {isUnlocked ? (
                          <Button
                            className="w-full"
                            variant={progress?.completed ? "outline" : "default"}
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            {progress?.completed ? 'Review Section' : 'Start Section'}
                          </Button>
                        ) : (
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-2">
                              <Lock className="w-3 h-3 inline mr-1" />
                              {unlockMessage}
                            </div>
                            <Button disabled className="w-full">
                              Locked
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

      </div>
      </div>
    </div>
  );
}