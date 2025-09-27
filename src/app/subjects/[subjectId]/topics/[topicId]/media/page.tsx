'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Trophy,
  Clock,
  CheckCircle,
  Zap,
  Award,
  Target,
  Video,
  Smartphone,
  Heart,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Pause,
  X,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { SurveyForm } from '@/components/surveys';
import { useShortsWatchTime } from '@/lib/hooks/useShortsWatchTime';
import ReactPlayer from 'react-player';

// Video interface for long-form content
interface VideoItem {
  id: string;
  title: string;
  description: string;
  url: string;
  youtubeId: string;
  duration: number;
  thumbnail?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  estimatedMinutes: number;
  order: number;
  preVideoContent: {
    learningObjectives: string[];
    prerequisites: string[];
    keyTerms: { term: string; definition: string }[];
  };
  postVideoContent: {
    keyConcepts: string[];
    reflectionQuestions: string[];
    practicalApplications: string[];
    additionalResources?: { title: string; url: string }[];
  };
}

// Short interface for micro-learning content
interface ShortItem {
  id: string;
  title: string;
  description: string;
  url: string;
  youtubeId: string;
  duration: number;
  thumbnail?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  order: number;
  // User engagement data
  isLiked: boolean;
  isSaved: boolean;
  userViewCount: number;
  userWatchTime: number;
  // Global engagement stats
  likes: number;
  views: number;
  saves: number;
  // Quiz data
  quizQuestions?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }[];
}

// Main media data interface
interface MediaData {
  topicName: string;
  subjectName: string;
  imageUrl?: string;
  totalXP: number;
  estimatedTime: number;
  videos: VideoItem[];
  shorts: ShortItem[];
}


interface MediaProgress {
  videoProgress: Record<string, { progress: number; completed: boolean; points: number }>;
  shortProgress: Record<string, { completed: boolean; points: number; watchCount: number }>;
  totalQuizCorrect: number;
  currentStreak: number;
  shortsWatchedToday: number;
}

export default function MediaPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mediaData, setMediaData] = useState<MediaData | null>(null);
  const [progress, setProgress] = useState<MediaProgress>({
    videoProgress: {},
    shortProgress: {},
    totalQuizCorrect: 0,
    currentStreak: 0,
    shortsWatchedToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'videos' | 'shorts'>('videos');

  // Videos tab state
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Shorts tab state
  const [currentShortIndex, setCurrentShortIndex] = useState(0);
  const [shortsWatchedCount, setShortsWatchedCount] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizResult, setQuizResult] = useState<{ isCorrect: boolean; explanation: string } | null>(null);

  // Survey state
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyData, setSurveyData] = useState<any>(null);

  // Engagement queue for batching
  const [engagementQueue, setEngagementQueue] = useState<Array<{
    mediaId: string;
    isLiked?: boolean;
    isSaved?: boolean;
    incrementViewCount?: boolean;
    addWatchTime?: number;
    timestamp: number;
  }>>([]);

  // Local engagement state for optimistic updates
  const [localEngagements, setLocalEngagements] = useState<Record<string, {
    isLiked: boolean;
    isSaved: boolean;
    viewsDelta: number;
    watchTimeDelta: number;
  }>>({});

  // Flag to prevent double-counting views from keyboard navigation
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);

  // Shorts watch time tracking
  const shortsWatchTime = useShortsWatchTime();

  // Development mode debugger
  const [showDebugger, setShowDebugger] = useState(process.env.NODE_ENV === 'development');
  const [currentDebugShort, setCurrentDebugShort] = useState<string | null>(null);

  const subjectId = params.subjectId as string;
  const topicId = params.topicId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && subjectId && topicId) {
      fetchMedia();
    }
  }, [status, subjectId, topicId, router]);

  // Keyboard navigation for shorts
  useEffect(() => {
    if (activeTab !== 'shorts' || !mediaData) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        // Go to next short
        if (currentShortIndex < mediaData.shorts.length - 1) {
          setIsKeyboardNavigation(true);
          setCurrentShortIndex(prev => prev + 1);
          setShortsWatchedCount(prev => prev + 1);

          // Update progress
          const short = mediaData.shorts[currentShortIndex + 1];
          setProgress(prev => ({
            ...prev,
            shortProgress: {
              ...prev.shortProgress,
              [short.id]: {
                completed: true,
                points: short.points,
                watchCount: (prev.shortProgress[short.id]?.watchCount || 0) + 1
              }
            },
            shortsWatchedToday: prev.shortsWatchedToday + 1
          }));

          // No longer need estimated watch time - tracking is now automatic

          // Scroll to next video
          const container = document.querySelector('.snap-y');
          if (container) {
            container.scrollTo({
              top: (currentShortIndex + 1) * container.clientHeight,
              behavior: 'smooth'
            });
            // Reset flag after scroll completes
            setTimeout(() => setIsKeyboardNavigation(false), 300);
          }
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        // Go to previous short
        if (currentShortIndex > 0) {
          setIsKeyboardNavigation(true);
          setCurrentShortIndex(prev => prev - 1);

          // No longer need estimated watch time - tracking is now automatic

          // Scroll to previous video
          const container = document.querySelector('.snap-y');
          if (container) {
            container.scrollTo({
              top: (currentShortIndex - 1) * container.clientHeight,
              behavior: 'smooth'
            });
            // Reset flag after scroll completes
            setTimeout(() => setIsKeyboardNavigation(false), 300);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTab, currentShortIndex, mediaData, shortsWatchedCount]);

  // Periodic sync for engagement queue
  useEffect(() => {
    const syncEngagements = async () => {
      if (engagementQueue.length === 0) return;

      try {
        // Batch engagements by mediaId to avoid duplicate updates
        const latestEngagements = new Map();

        engagementQueue.forEach(engagement => {
          const existing = latestEngagements.get(engagement.mediaId) || {
            mediaId: engagement.mediaId,
            isLiked: undefined,
            isSaved: undefined,
            incrementViewCount: false,
            addWatchTime: 0
          };

          if (engagement.isLiked !== undefined) existing.isLiked = engagement.isLiked;
          if (engagement.isSaved !== undefined) existing.isSaved = engagement.isSaved;
          if (engagement.incrementViewCount) existing.incrementViewCount = true;
          if (engagement.addWatchTime) existing.addWatchTime += engagement.addWatchTime;

          latestEngagements.set(engagement.mediaId, existing);
        });

        const batchedEngagements = Array.from(latestEngagements.values());

        const response = await fetch('/api/media/engage/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ engagements: batchedEngagements }),
        });

        if (response.ok) {
          // Clear the queue on successful sync
          setEngagementQueue([]);
          console.log(`Synced ${batchedEngagements.length} engagement updates`);
        } else {
          console.error('Failed to sync engagements:', await response.text());
        }
      } catch (error) {
        console.error('Error syncing engagements:', error);
      }
    };

    // Sync every 5 seconds if there are queued engagements
    const interval = setInterval(syncEngagements, 5000);
    return () => clearInterval(interval);
  }, [engagementQueue]);

  // Sync engagements when component unmounts
  useEffect(() => {
    return () => {
      if (engagementQueue.length > 0) {
        // Final sync attempt
        fetch('/api/media/engage/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ engagements: engagementQueue }),
        }).catch(console.error);
      }
    };
  }, [engagementQueue]);

  // Watch for media completion to trigger survey
  useEffect(() => {
    if (mediaData && checkAllMediaCompleted() && !showSurveyModal) {
      // Add small delay to ensure all progress updates are complete
      const timer = setTimeout(() => {
        checkForSurvey();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [progress, mediaData, showSurveyModal]);

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/topics/${topicId}/media`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push(`/subjects/${subjectId}/topics/${topicId}`);
          return;
        }
        throw new Error('Failed to fetch media');
      }

      const data = await response.json();

      // Randomize shorts order for TikTok-style engagement
      if (data.shorts && data.shorts.length > 0) {
        data.shorts = [...data.shorts].sort(() => Math.random() - 0.5);
      }

      // Debug: Check if any shorts have quiz questions
      console.log('Loaded media data:', {
        videosCount: data.videos?.length || 0,
        shortsCount: data.shorts?.length || 0,
        shortsWithQuiz: data.shorts?.filter((s: any) => s.quizQuestions && s.quizQuestions.length > 0).length || 0
      });

      setMediaData(data);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoProgress = (videoId: string, progressValue: number, completed: boolean, points: number) => {
    setProgress(prev => ({
      ...prev,
      videoProgress: {
        ...prev.videoProgress,
        [videoId]: { progress: progressValue, completed, points }
      }
    }));

    // Check for survey when all videos are completed (but don't auto-advance)
    if (completed && mediaData) {
      const currentVideo = mediaData.videos[currentVideoIndex];
      if (currentVideo && currentVideo.id === videoId && currentVideoIndex === mediaData.videos.length - 1) {
        // Only trigger survey check if this is the last video
        setTimeout(() => {
          if (checkAllMediaCompleted()) {
            checkForSurvey();
          }
        }, 500); // Small delay to let state update
      }
    }
  };

  const triggerRandomQuiz = () => {
    if (!mediaData?.shorts || mediaData.shorts.length === 0) return;

    // Find shorts with quiz questions
    const shortsWithQuiz = mediaData.shorts.filter(short =>
      short.quizQuestions && short.quizQuestions.length > 0
    );

    if (shortsWithQuiz.length === 0) return;

    // Pick a random short with quiz
    const randomShort = shortsWithQuiz[Math.floor(Math.random() * shortsWithQuiz.length)];

    // Pick a random question from that short
    const randomQuestion = randomShort.quizQuestions![Math.floor(Math.random() * randomShort.quizQuestions!.length)];

    setCurrentQuiz(randomQuestion);
    setSelectedAnswer(null);
    setQuizAnswered(false);
    setQuizResult(null);
    setShowQuiz(true);
  };

  const handleQuizAnswer = (answerIndex: number) => {
    if (quizAnswered || !currentQuiz) return;

    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === currentQuiz.correctAnswer;

    setQuizResult({
      isCorrect,
      explanation: currentQuiz.explanation || (isCorrect ? 'Correct!' : 'Incorrect, try again next time!')
    });

    setQuizAnswered(true);

    // Update progress
    if (isCorrect) {
      setProgress(prev => ({
        ...prev,
        totalQuizCorrect: prev.totalQuizCorrect + 1,
        currentStreak: prev.currentStreak + 1
      }));
    }
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setCurrentQuiz(null);
    setSelectedAnswer(null);
    setQuizAnswered(false);
    setQuizResult(null);
  };

  const handleEngagement = (mediaId: string, action: 'like' | 'save') => {
    if (!mediaData) return;

    // Get current engagement state
    const currentLocal = localEngagements[mediaId] || {
      isLiked: false,
      isSaved: false,
      viewsDelta: 0,
      watchTimeDelta: 0
    };

    // Update local state optimistically
    const newLocal = { ...currentLocal };

    if (action === 'like') {
      newLocal.isLiked = !newLocal.isLiked;
    } else if (action === 'save') {
      newLocal.isSaved = !newLocal.isSaved;
    }

    setLocalEngagements(prev => ({
      ...prev,
      [mediaId]: newLocal
    }));

    // Queue the engagement update
    setEngagementQueue(prev => [...prev, {
      mediaId,
      isLiked: action === 'like' ? newLocal.isLiked : undefined,
      isSaved: action === 'save' ? newLocal.isSaved : undefined,
      timestamp: Date.now()
    }]);

    // Update the UI immediately (optimistic update)
    setMediaData(prev => ({
      ...prev!,
      shorts: prev!.shorts.map(short => {
        if (short.id === mediaId) {
          const update: any = {};

          if (action === 'like') {
            update.isLiked = newLocal.isLiked;
            update.likes = newLocal.isLiked
              ? short.likes + 1
              : Math.max(0, short.likes - 1);
          } else if (action === 'save') {
            update.isSaved = newLocal.isSaved;
          }

          return { ...short, ...update };
        }
        return short;
      })
    }));
  };

  const handleViewCountIncrement = async (mediaId: string, watchTime: number = 0) => {
    if (!mediaData) return;

    const currentLocal = localEngagements[mediaId] || {
      isLiked: false,
      isSaved: false,
      viewsDelta: 0,
      watchTimeDelta: 0
    };

    const newLocal = {
      ...currentLocal,
      viewsDelta: currentLocal.viewsDelta + 1,
      watchTimeDelta: currentLocal.watchTimeDelta + watchTime
    };

    setLocalEngagements(prev => ({
      ...prev,
      [mediaId]: newLocal
    }));

    // Get enhanced tracking data for shorts
    const watchData = shortsWatchTime.getWatchTimeData(mediaId);
    const engagementScore = shortsWatchTime.getEngagementScore(mediaId);
    const isGenuine = shortsWatchTime.isGenuineWatch(mediaId, 30);

    // Queue the view update with enhanced data
    setEngagementQueue(prev => [...prev, {
      mediaId,
      incrementViewCount: true,
      addWatchTime: watchTime,
      actualWatchTime: watchData?.actualWatchTime || watchTime,
      engagementScore: engagementScore,
      isGenuineWatch: isGenuine,
      visibility: watchData?.visibility || 100,
      seekEvents: watchData?.seekEvents || 0,
      pauseEvents: watchData?.pauseEvents || 0,
      timestamp: Date.now()
    }]);

    // Also track progress via API for shorts
    try {
      const short = mediaData.shorts.find(s => s.id === mediaId);
      if (short) {
        const response = await fetch('/api/user/progress/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId: mediaId,
            contentType: 'media',
            topicId: topicId,
            subjectId: subjectId,
            completed: true, // Shorts are completed when viewed
            score: 1.0, // Full completion for shorts
            timeSpent: watchTime,
            data: {
              watchTime: watchTime,
              difficulty: short.difficulty,
              videoType: 'short',
              viewCount: newLocal.viewsDelta
            }
          }),
        });

        const result = await response.json();
        if (result.success) {
          console.log(`Short ${mediaId} progress tracked, XP earned: ${result.xpEarned || 0}`);
        }
      }
    } catch (error) {
      console.error('Error tracking short progress:', error);
    }

    // Update UI optimistically
    setMediaData(prev => ({
      ...prev!,
      shorts: prev!.shorts.map(short => {
        if (short.id === mediaId) {
          return {
            ...short,
            views: short.views + 1,
            userViewCount: (short.userViewCount || 0) + 1,
            userWatchTime: (short.userWatchTime || 0) + watchTime
          };
        }
        return short;
      })
    }));
  };

  const checkForSurvey = async () => {
    try {
      const response = await fetch(`/api/surveys/trigger?triggerType=media_completion&contentId=${topicId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.survey && !data.alreadyCompleted) {
          setSurveyData(data);
          setShowSurveyModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking for survey:', error);
    }
  };

  const handleSurveyComplete = () => {
    setShowSurveyModal(false);
    setSurveyData(null);
  };

  const checkAllMediaCompleted = () => {
    if (!mediaData) return false;

    // Check if all videos are completed
    const allVideosCompleted = mediaData.videos.every(video =>
      progress.videoProgress[video.id]?.completed
    );

    // Check if all shorts are completed
    const allShortsCompleted = mediaData.shorts.every(short =>
      progress.shortProgress[short.id]?.completed
    );

    return allVideosCompleted && allShortsCompleted;
  };

  const calculateOverallProgress = () => {
    if (!mediaData) return { completed: 0, total: 0, points: 0, maxPoints: 0 };

    const totalItems = mediaData.videos.length + mediaData.shorts.length;
    let completedItems = 0;
    let earnedPoints = 0;

    // Count completed videos
    mediaData.videos.forEach(video => {
      if (progress.videoProgress[video.id]?.completed) {
        completedItems++;
        earnedPoints += progress.videoProgress[video.id].points;
      }
    });

    // Count completed shorts
    mediaData.shorts.forEach(short => {
      if (progress.shortProgress[short.id]?.completed) {
        completedItems++;
        earnedPoints += progress.shortProgress[short.id].points;
      }
    });

    return {
      completed: completedItems,
      total: totalItems,
      points: earnedPoints,
      maxPoints: mediaData.totalXP
    };
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading educational YouTube videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Media</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchMedia} variant="outline">
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

  if (!mediaData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Media content not found</p>
          <Button asChild className="mt-4">
            <Link href={`/subjects/${subjectId}/topics/${topicId}`}>Back to Topic</Link>
          </Button>
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();
  const progressPercentage = overallProgress.total > 0 ? Math.round((overallProgress.completed / overallProgress.total) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Modern Banner */}
      <div className="relative h-80 overflow-hidden">
        {mediaData.imageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${mediaData.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-orange-700 to-yellow-800" />
        )}

        <div className="relative h-full flex flex-col justify-center px-4">
          <div className="max-w-6xl mx-auto w-full">
            <Link
              href={`/subjects/${subjectId}/topics/${topicId}`}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm mb-6 transition-all duration-300 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 hover:bg-white/15 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {mediaData.topicName}
            </Link>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-8 items-center">
              {/* Left Column - Title */}
              <div className="lg:col-span-2">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{mediaData.topicName} Media</h1>
                <p className="text-white/80 text-lg mb-4">{mediaData.subjectName}</p>

                {/* Progress indicator */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/90 font-medium text-sm">Learning Progress</span>
                    <span className="font-bold text-white">{overallProgress.completed}/{overallProgress.total}</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${overallProgress.total > 0 ? (overallProgress.completed / overallProgress.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Key Stats */}
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Trophy className="w-4 h-4 text-white" />
                    <span className="text-white/70 font-medium text-xs">XP Earned</span>
                  </div>
                  <div className="text-xl font-bold text-white">{overallProgress.points}/{overallProgress.maxPoints}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Video className="w-3 h-3 text-white" />
                      <span className="text-white/70 font-medium text-xs">Videos</span>
                    </div>
                    <div className="text-sm font-bold text-white">{mediaData.videos.length}</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Smartphone className="w-3 h-3 text-white" />
                      <span className="text-white/70 font-medium text-xs">Shorts</span>
                    </div>
                    <div className="text-sm font-bold text-white">{mediaData.shorts.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">


        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 mb-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'videos'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Video className="w-5 h-5" />
              <span>Videos ({mediaData.videos.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('shorts')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'shorts'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <span>Shorts ({mediaData.shorts.length})</span>
            </button>
          </div>
        </div>

        {/* Videos Tab Content - Step-by-Step Wizard */}
        {activeTab === 'videos' && mediaData.videos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            {/* Header with Progress */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Learning Videos</h2>
                  <p className="text-gray-600">Video {currentVideoIndex + 1} of {mediaData.videos.length}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="text-lg font-semibold text-blue-600">
                  {Math.round(((currentVideoIndex + (progress.videoProgress[mediaData.videos[currentVideoIndex]?.id]?.completed ? 1 : 0)) / mediaData.videos.length) * 100)}%
                </div>
              </div>
            </div>

            {/* Video Progress Indicator */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Video Progress</span>
                <span className="text-sm text-gray-500">{currentVideoIndex + 1}/{mediaData.videos.length}</span>
              </div>
              <div className="flex gap-2">
                {mediaData.videos.map((video, index) => (
                  <div
                    key={video.id}
                    className={`flex-1 h-2 rounded-full ${
                      index < currentVideoIndex || progress.videoProgress[video.id]?.completed
                        ? 'bg-green-500'
                        : index === currentVideoIndex
                        ? 'bg-blue-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {mediaData.videos.map((video, index) => (
                  <span
                    key={video.id}
                    className={`text-xs ${
                      index < currentVideoIndex || progress.videoProgress[video.id]?.completed
                        ? 'text-green-600'
                        : index === currentVideoIndex
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {index < currentVideoIndex || progress.videoProgress[video.id]?.completed ? '✓' :
                     index === currentVideoIndex ? '▶' : '🔒'}
                  </span>
                ))}
              </div>
            </div>

            {/* Current Video Content */}
            {mediaData.videos[currentVideoIndex] && (
              <motion.div
                key={currentVideoIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Pre-Video Content */}
                {(mediaData.videos[currentVideoIndex].preVideoContent.learningObjectives.length > 0 ||
                  mediaData.videos[currentVideoIndex].preVideoContent.prerequisites.length > 0 ||
                  mediaData.videos[currentVideoIndex].preVideoContent.keyTerms.length > 0) && (
                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-blue-900">Before You Watch</h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      {mediaData.videos[currentVideoIndex].preVideoContent.learningObjectives.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-800 mb-2">Learning Objectives</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {mediaData.videos[currentVideoIndex].preVideoContent.learningObjectives.map((objective, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-blue-500 mt-1">•</span>
                                {objective}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {mediaData.videos[currentVideoIndex].preVideoContent.prerequisites.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-800 mb-2">Prerequisites</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {mediaData.videos[currentVideoIndex].preVideoContent.prerequisites.map((prereq, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-blue-500 mt-1">•</span>
                                {prereq}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {mediaData.videos[currentVideoIndex].preVideoContent.keyTerms.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-800 mb-2">Key Terms</h4>
                          <div className="space-y-2">
                            {mediaData.videos[currentVideoIndex].preVideoContent.keyTerms.map((term, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium text-blue-800">{term.term}:</span>
                                <span className="text-blue-700 ml-1">{term.definition}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Video Player */}
                <VideoPlayer
                  video={{
                    id: mediaData.videos[currentVideoIndex].id,
                    title: mediaData.videos[currentVideoIndex].title,
                    description: mediaData.videos[currentVideoIndex].description,
                    url: mediaData.videos[currentVideoIndex].url,
                    duration: mediaData.videos[currentVideoIndex].duration, // Actual duration from YouTube API
                    thumbnail: mediaData.videos[currentVideoIndex].thumbnail,
                    difficulty: mediaData.videos[currentVideoIndex].difficulty,
                    points: mediaData.videos[currentVideoIndex].points,
                    topics: []
                  }}
                  onProgress={handleVideoProgress}
                  initialProgress={progress.videoProgress[mediaData.videos[currentVideoIndex].id]?.progress || 0}
                  isCompleted={progress.videoProgress[mediaData.videos[currentVideoIndex].id]?.completed || false}
                  topicId={topicId}
                  subjectId={subjectId}
                />

                {/* Post-Video Content */}
                {(mediaData.videos[currentVideoIndex].postVideoContent.keyConcepts.length > 0 ||
                  mediaData.videos[currentVideoIndex].postVideoContent.reflectionQuestions.length > 0 ||
                  mediaData.videos[currentVideoIndex].postVideoContent.practicalApplications.length > 0 ||
                  (mediaData.videos[currentVideoIndex].postVideoContent.additionalResources && mediaData.videos[currentVideoIndex].postVideoContent.additionalResources.length > 0)) && (
                  <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-green-900">After Watching</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {mediaData.videos[currentVideoIndex].postVideoContent.keyConcepts.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">Key Concepts</h4>
                          <ul className="text-sm text-green-700 space-y-1">
                            {mediaData.videos[currentVideoIndex].postVideoContent.keyConcepts.map((concept, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-green-500 mt-1">•</span>
                                {concept}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {mediaData.videos[currentVideoIndex].postVideoContent.reflectionQuestions.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">Reflection Questions</h4>
                          <ul className="text-sm text-green-700 space-y-2">
                            {mediaData.videos[currentVideoIndex].postVideoContent.reflectionQuestions.map((question, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-green-500 mt-1">?</span>
                                {question}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {mediaData.videos[currentVideoIndex].postVideoContent.practicalApplications.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">Practical Applications</h4>
                          <ul className="text-sm text-green-700 space-y-1">
                            {mediaData.videos[currentVideoIndex].postVideoContent.practicalApplications.map((application, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-green-500 mt-1">•</span>
                                {application}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {mediaData.videos[currentVideoIndex].postVideoContent.additionalResources && mediaData.videos[currentVideoIndex].postVideoContent.additionalResources.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">Additional Resources</h4>
                          <ul className="text-sm space-y-1">
                            {mediaData.videos[currentVideoIndex].postVideoContent.additionalResources.map((resource, idx) => (
                              <li key={idx}>
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-800 underline flex items-center gap-1"
                                >
                                  <span>{resource.title}</span>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                                  </svg>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Controls */}
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
                  <Button
                    onClick={() => setCurrentVideoIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentVideoIndex === 0}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous Video
                  </Button>

                  <div className="text-center">
                    <div className="text-sm text-gray-600">Video {currentVideoIndex + 1} of {mediaData.videos.length}</div>
                    <div className="text-lg font-semibold">
                      {mediaData.videos[currentVideoIndex]?.title}
                    </div>
                  </div>

                  <Button
                    onClick={() => setCurrentVideoIndex(prev => Math.min(mediaData.videos.length - 1, prev + 1))}
                    disabled={
                      currentVideoIndex === mediaData.videos.length - 1 ||
                      !progress.videoProgress[mediaData.videos[currentVideoIndex]?.id]?.completed
                    }
                    className="flex items-center gap-2"
                  >
                    Next Video
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Empty State for Videos */}
        {activeTab === 'videos' && mediaData.videos.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Video className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Videos Available</h3>
            <p className="text-gray-600">Long-form educational videos will appear here when added.</p>
          </motion.div>
        )}

        {/* Shorts Tab Content - True TikTok Style */}
        {activeTab === 'shorts' && mediaData.shorts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black md:relative md:inset-auto md:rounded-xl md:overflow-hidden md:h-[800px]"
          >
            {/* Header Overlay - Mobile Only */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4 md:hidden">
              <div className="flex items-center justify-between text-white">
                <button
                  onClick={() => setActiveTab('videos')}
                  className="p-2"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="text-center">
                  <div className="text-sm">Learning Shorts</div>
                  <div className="text-xs opacity-80">Swipe up for next</div>
                </div>
                <div className="text-right">
                  <div className="text-xs">🔥 {progress.currentStreak}</div>
                </div>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between p-4 bg-black text-white">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5" />
                <span className="font-semibold">Learning Shorts</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Streak:</span> {progress.currentStreak} 🔥
              </div>
            </div>

            {/* Shorts Container - Vertical Scroll */}
            <div
              className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={(e) => {
                const container = e.currentTarget;
                const scrollPosition = container.scrollTop;
                const itemHeight = container.offsetHeight;
                const newIndex = Math.round(scrollPosition / itemHeight);

                if (newIndex !== currentShortIndex && newIndex < mediaData.shorts.length) {
                  setCurrentShortIndex(newIndex);
                  setShortsWatchedCount(prev => prev + 1);

                  // Update progress and view count
                  const short = mediaData.shorts[newIndex];
                  setProgress(prev => ({
                    ...prev,
                    shortProgress: {
                      ...prev.shortProgress,
                      [short.id]: {
                        completed: true,
                        points: short.points,
                        watchCount: (prev.shortProgress[short.id]?.watchCount || 0) + 1
                      }
                    },
                    shortsWatchedToday: prev.shortsWatchedToday + 1
                  }));

                  // Track actual watch time using the new system
                  if (!isKeyboardNavigation) {
                    const watchData = shortsWatchTime.getWatchTimeData(short.id);
                    if (watchData && watchData.actualWatchTime > 0) {
                      handleViewCountIncrement(short.id, watchData.actualWatchTime);

                      // Update progress for genuine watches
                      if (shortsWatchTime.isGenuineWatch(short.id, 30)) {
                        shortsWatchTime.updateProgress(short.id, topicId, subjectId);
                      }
                    }
                  }

                  // Check for quiz trigger every 3-5 shorts
                  const triggerAt = 3 + Math.floor(Math.random() * 3); // Random between 3-5
                  if ((shortsWatchedCount + 1) % triggerAt === 0) {
                    setTimeout(() => triggerRandomQuiz(), 500); // Small delay after scroll
                  }
                }
              }}
            >
              {mediaData.shorts.map((short, index) => (
                <div
                  key={short.id}
                  data-short-id={short.id}
                  className="relative h-full w-full snap-start snap-always flex items-center justify-center"
                >
                  {/* Video Player */}
                  <ReactPlayer
                    key={`short-${short.id}-${index === currentShortIndex ? 'active' : 'inactive'}`}
                    url={short.url}
                    width="100%"
                    height="100%"
                    playing={index === currentShortIndex}
                    loop={true}
                    muted={index !== currentShortIndex}
                    controls={false}
                    style={{ position: 'absolute', top: 0, left: 0 }}
                    onPlay={() => {
                      const reactPlayer = document.querySelector(`[data-short-id="${short.id}"]`);
                      if (reactPlayer) {
                        shortsWatchTime.initializeTracking(short.id, reactPlayer as HTMLElement);
                      }
                      shortsWatchTime.onPlay(short.id, 0, short.duration);
                    }}
                    onPause={() => {
                      shortsWatchTime.onPause(short.id, 0, short.duration);
                    }}
                    onProgress={(state) => {
                      shortsWatchTime.onProgress(short.id, state.playedSeconds, short.duration);

                      // Update debug info for current short
                      if (index === currentShortIndex) {
                        setCurrentDebugShort(short.id);
                      }
                    }}
                    onEnded={() => {
                      shortsWatchTime.onEnd(short.id, short.duration);

                      // Update progress when video ends
                      if (shortsWatchTime.isGenuineWatch(short.id, 30)) {
                        shortsWatchTime.updateProgress(short.id, topicId, subjectId);
                      }
                    }}
                    config={{
                      youtube: {
                        playerVars: {
                          showinfo: 0,        // Hide video information overlay
                          controls: 0,        // Hide all player controls
                          modestbranding: 1,  // Reduce YouTube branding
                          rel: 0,             // Disable related videos
                          autoplay: 1,        // Enable autoplay
                          playsinline: 1,     // Play inline on mobile
                          start: 0,           // Start from beginning
                          iv_load_policy: 3,  // Hide video annotations
                          cc_load_policy: 0,  // Hide closed captions by default
                          disablekb: 1,       // Disable keyboard controls
                          fs: 0,              // Hide fullscreen button
                          enablejsapi: 0,     // Disable JavaScript API
                          origin: typeof window !== 'undefined' ? window.location.origin : '',
                          widget_referrer: typeof window !== 'undefined' ? window.location.origin : ''
                        }
                      }
                    }}
                  />

                  {/* Overlay Content */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Video Info - Bottom Left */}
                    <div className="absolute bottom-20 left-4 right-20 text-white pointer-events-auto">
                      <div className="mb-2">
                        <h3 className="font-bold text-lg drop-shadow-lg">{short.title}</h3>
                        <p className="text-sm opacity-90 drop-shadow-md line-clamp-2">{short.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-black/50 backdrop-blur px-2 py-1 rounded-full">
                          {short.difficulty}
                        </span>
                        <span className="text-xs bg-purple-600/80 backdrop-blur px-2 py-1 rounded-full">
                          +{short.points} XP
                        </span>
                        <span className="text-xs bg-black/50 backdrop-blur px-2 py-1 rounded-full">
                          👁 {short.views}
                        </span>
                        {/* Real-time watch time indicator */}
                        {(() => {
                          const watchData = shortsWatchTime.getWatchTimeData(short.id);
                          const engagementScore = shortsWatchTime.getEngagementScore(short.id);
                          if (watchData && watchData.actualWatchTime > 0) {
                            return (
                              <>
                                <span className="text-xs bg-green-600/80 backdrop-blur px-2 py-1 rounded-full">
                                  ⏱ {Math.round(watchData.actualWatchTime)}s
                                </span>
                                <span className={`text-xs backdrop-blur px-2 py-1 rounded-full ${
                                  engagementScore >= 70 ? 'bg-green-600/80' :
                                  engagementScore >= 40 ? 'bg-yellow-600/80' :
                                  'bg-red-600/80'
                                }`}>
                                  📊 {engagementScore}%
                                </span>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* Action Buttons - Right Side */}
                    <div className="absolute right-4 bottom-20 flex flex-col gap-4 pointer-events-auto">
                      {/* Like Button */}
                      <button
                        className="flex flex-col items-center gap-1 transition-transform active:scale-110"
                        onClick={() => handleEngagement(short.id, 'like')}
                      >
                        <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-white/20 transition-colors">
                          <Heart className={`w-7 h-7 transition-all duration-200 ${
                            short.isLiked
                              ? 'fill-red-500 text-red-500 scale-110'
                              : 'text-white hover:text-red-300'
                          }`} />
                        </div>
                        <span className="text-xs text-white font-semibold">
                          {short.likes}
                        </span>
                      </button>

                      {/* Save Button */}
                      <button
                        className="flex flex-col items-center gap-1 transition-transform active:scale-110"
                        onClick={() => handleEngagement(short.id, 'save')}
                      >
                        <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-white/20 transition-colors">
                          <Bookmark className={`w-7 h-7 transition-all duration-200 ${
                            short.isSaved
                              ? 'fill-yellow-500 text-yellow-500 scale-110'
                              : 'text-white hover:text-yellow-300'
                          }`} />
                        </div>
                        <span className="text-xs text-white font-semibold">
                          {short.isSaved ? 'Saved' : 'Save'}
                        </span>
                      </button>

                      {/* Quiz Button - Only show if this short has quiz questions */}
                      {short.quizQuestions && short.quizQuestions.length > 0 && (
                        <button
                          className="flex flex-col items-center gap-1 transition-transform active:scale-110"
                          onClick={() => {
                            console.log('Quiz button clicked for short:', short);
                            const randomQuestion = short.quizQuestions[Math.floor(Math.random() * short.quizQuestions.length)];
                            setCurrentQuiz(randomQuestion);
                            setSelectedAnswer(null);
                            setQuizAnswered(false);
                            setQuizResult(null);
                            setShowQuiz(true);
                          }}
                        >
                          <div className="bg-purple-600 rounded-full p-3 hover:bg-purple-700">
                            <Zap className="w-7 h-7 text-white" />
                          </div>
                          <span className="text-xs text-white font-semibold">Quiz</span>
                        </button>
                      )}
                    </div>

                    {/* Progress Dots - Right Side */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none">
                      {mediaData.shorts.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1 transition-all duration-300 rounded-full ${
                            idx === index
                              ? 'h-8 bg-white'
                              : idx < index
                              ? 'h-1 bg-white/60'
                              : 'h-1 bg-white/30'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Swipe Hint - Only on first video */}
                    {index === 0 && currentShortIndex === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="absolute bottom-32 left-1/2 -translate-x-1/2"
                      >
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="text-white text-center"
                        >
                          <ChevronLeft className="w-8 h-8 mx-auto rotate-90" />
                          <span className="text-sm">Swipe up for next</span>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Keyboard Navigation Helper */}
            <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xs bg-black/50 backdrop-blur px-3 py-1 rounded-full">
              Use ↑↓ arrow keys to navigate
            </div>
          </motion.div>
        )}

        {/* Empty State for Shorts */}
        {activeTab === 'shorts' && mediaData.shorts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Smartphone className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Shorts Available</h3>
            <p className="text-gray-600">Check back later for bite-sized learning content!</p>
          </motion.div>
        )}

        {/* Mini-Quiz Modal */}
        {showQuiz && currentQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeQuiz()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Quick Quiz! 🧠</h3>
                    <p className="text-purple-100 text-sm">Test what you learned</p>
                  </div>
                  <button
                    onClick={closeQuiz}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quiz Content */}
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    {currentQuiz.question}
                  </h4>

                  <div className="space-y-3">
                    {currentQuiz.options.map((option, index) => {
                      let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ";

                      if (!quizAnswered) {
                        buttonClass += selectedAnswer === index
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 hover:border-purple-300 hover:bg-purple-50";
                      } else {
                        if (index === currentQuiz.correctAnswer) {
                          buttonClass += "border-green-500 bg-green-50 text-green-700";
                        } else if (selectedAnswer === index && index !== currentQuiz.correctAnswer) {
                          buttonClass += "border-red-500 bg-red-50 text-red-700";
                        } else {
                          buttonClass += "border-gray-200 bg-gray-50 text-gray-500";
                        }
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => handleQuizAnswer(index)}
                          disabled={quizAnswered}
                          className={buttonClass}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`
                              w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold
                              ${!quizAnswered
                                ? selectedAnswer === index
                                  ? 'border-purple-500 bg-purple-500 text-white'
                                  : 'border-gray-300 text-gray-500'
                                : index === currentQuiz.correctAnswer
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : selectedAnswer === index && index !== currentQuiz.correctAnswer
                                    ? 'border-red-500 bg-red-500 text-white'
                                    : 'border-gray-300 text-gray-400'
                              }
                            `}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="flex-1">{option}</span>
                            {quizAnswered && index === currentQuiz.correctAnswer && (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            )}
                            {quizAnswered && selectedAnswer === index && index !== currentQuiz.correctAnswer && (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Result and Explanation */}
                {quizResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${
                      quizResult.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {quizResult.isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-semibold ${quizResult.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                          {quizResult.isCorrect ? 'Correct! 🎉' : 'Not quite right 🤔'}
                        </p>
                        <p className={`text-sm mt-1 ${quizResult.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                          {quizResult.explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={closeQuiz}
                    className="flex-1"
                  >
                    Continue Learning
                  </Button>
                  {quizAnswered && (
                    <Button
                      onClick={() => {
                        closeQuiz();
                        setTimeout(() => triggerRandomQuiz(), 1000);
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Another Quiz
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Video Series Completion */}
        {activeTab === 'videos' && mediaData.videos.length > 0 &&
         mediaData.videos.every(video => progress.videoProgress[video.id]?.completed) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6 text-center"
            data-completion-section
          >
            <Trophy className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-blue-800 mb-2">All Videos Completed! 🎉</h3>
            <p className="text-blue-700 mb-4">
              Amazing work! You've successfully completed all {mediaData.videos.length} learning videos for {mediaData.topicName}.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {mediaData.videos.reduce((sum, video) =>
                    sum + (progress.videoProgress[video.id]?.points || 0), 0
                  )}
                </div>
                <div className="text-sm text-blue-600">XP from Videos</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-2xl font-bold text-green-600">{mediaData.videos.length}</div>
                <div className="text-sm text-green-600">Videos Mastered</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(mediaData.videos.reduce((sum, video) => sum + video.duration, 0) / 60)}
                </div>
                <div className="text-sm text-purple-600">Minutes of Content</div>
              </div>
            </div>
            {mediaData.shorts.length > 0 && (
              <div className="bg-white/50 rounded-lg p-4 border border-blue-100">
                <p className="text-blue-700 font-medium mb-2">Ready for more learning?</p>
                <Button
                  onClick={() => setActiveTab('shorts')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Explore Learning Shorts ({mediaData.shorts.length})
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Overall Completion Summary */}
        {progressPercentage === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 text-center"
          >
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-800 mb-2">All Media Completed!</h3>
            <p className="text-green-700 mb-4">
              Congratulations! You've completed all media content for {mediaData.topicName}.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold">{overallProgress.points} XP Earned</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-semibold">{overallProgress.completed} Items Completed</span>
              </div>
            </div>
          </motion.div>
        )}
        </div>
      </div>

      {/* Survey Form */}
      {surveyData && (
        <div className="mt-8">
          <SurveyForm
            survey={surveyData.survey}
            triggerContentId={surveyData.triggerContentId}
            onSubmitSuccess={handleSurveyComplete}
          />
        </div>
      )}
    </div>
  );
} 