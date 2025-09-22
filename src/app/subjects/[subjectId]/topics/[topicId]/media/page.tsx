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
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/media/VideoPlayer';
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
  // Engagement tracking
  likes: number;
  views: number;
  isLiked?: boolean;
  isSaved?: boolean;
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

          // Scroll to next video
          const container = document.querySelector('.snap-y');
          if (container) {
            container.scrollTo({
              top: (currentShortIndex + 1) * container.clientHeight,
              behavior: 'smooth'
            });
          }
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        // Go to previous short
        if (currentShortIndex > 0) {
          setCurrentShortIndex(prev => prev - 1);

          // Scroll to previous video
          const container = document.querySelector('.snap-y');
          if (container) {
            container.scrollTo({
              top: (currentShortIndex - 1) * container.clientHeight,
              behavior: 'smooth'
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTab, currentShortIndex, mediaData, shortsWatchedCount]);

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading educational YouTube videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/subjects/${subjectId}/topics/${topicId}`}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {mediaData.topicName}
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mediaData.topicName} Media</h1>
              <p className="text-gray-600">{mediaData.subjectName}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Progress: {overallProgress.completed}/{overallProgress.total}</div>
              <div className="text-lg font-semibold text-indigo-600">{overallProgress.points}/{overallProgress.maxPoints} XP</div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Learning Progress</h2>
            <div className="text-2xl font-bold text-indigo-600">{progressPercentage}%</div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <motion.div
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <Video className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">{mediaData.videos.length}</div>
              <div className="text-sm text-blue-600">Long Videos</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <Smartphone className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700">{mediaData.shorts.length}</div>
              <div className="text-sm text-purple-600">Shorts</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-700">{mediaData.estimatedTime}</div>
              <div className="text-sm text-yellow-600">Minutes</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">{overallProgress.points}</div>
              <div className="text-sm text-green-600">XP Earned</div>
            </div>
          </div>
        </motion.div>

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
                    duration: mediaData.videos[currentVideoIndex].duration,
                    thumbnail: mediaData.videos[currentVideoIndex].thumbnail,
                    difficulty: mediaData.videos[currentVideoIndex].difficulty,
                    points: mediaData.videos[currentVideoIndex].points,
                    topics: []
                  }}
                  onProgress={handleVideoProgress}
                  initialProgress={progress.videoProgress[mediaData.videos[currentVideoIndex].id]?.progress || 0}
                  isCompleted={progress.videoProgress[mediaData.videos[currentVideoIndex].id]?.completed || false}
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

                  // Update progress
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

                  // Check for quiz trigger
                  if ((shortsWatchedCount + 1) % 3 === 0) {
                    setShowQuiz(true);
                  }
                }
              }}
            >
              {mediaData.shorts.map((short, index) => (
                <div
                  key={short.id}
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
                    config={{
                      youtube: {
                        playerVars: {
                          showinfo: 0,
                          controls: 0,
                          modestbranding: 1,
                          rel: 0,
                          autoplay: 1,
                          playsinline: 1,
                          start: 0
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-black/50 backdrop-blur px-2 py-1 rounded-full">
                          {short.difficulty}
                        </span>
                        <span className="text-xs bg-purple-600/80 backdrop-blur px-2 py-1 rounded-full">
                          +{short.points} XP
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons - Right Side */}
                    <div className="absolute right-4 bottom-20 flex flex-col gap-4 pointer-events-auto">
                      {/* Like Button */}
                      <button
                        className="flex flex-col items-center gap-1 transition-transform active:scale-110"
                        onClick={() => {
                          // Handle like
                        }}
                      >
                        <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-white/20">
                          <Heart className={`w-7 h-7 ${short.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        </div>
                        <span className="text-xs text-white font-semibold">{short.likes || 0}</span>
                      </button>

                      {/* Save Button */}
                      <button
                        className="flex flex-col items-center gap-1 transition-transform active:scale-110"
                        onClick={() => {
                          // Handle save
                        }}
                      >
                        <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-white/20">
                          <Bookmark className={`w-7 h-7 ${short.isSaved ? 'fill-yellow-500 text-yellow-500' : 'text-white'}`} />
                        </div>
                        <span className="text-xs text-white font-semibold">Save</span>
                      </button>

                      {/* Quiz Button */}
                      <button
                        className="flex flex-col items-center gap-1 transition-transform active:scale-110"
                        onClick={() => {
                          setShowQuiz(true);
                        }}
                      >
                        <div className="bg-purple-600 rounded-full p-3 hover:bg-purple-700">
                          <Zap className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-xs text-white font-semibold">Quiz</span>
                      </button>
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

        {/* Completion Summary */}
        {progressPercentage === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 text-center"
          >
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-800 mb-2">Videos Completed!</h3>
            <p className="text-green-700 mb-4">
              Congratulations! You've watched all YouTube videos for {mediaData.topicName}.
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
  );
} 