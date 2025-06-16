'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft,
  Play,
  Image as ImageIcon,
  Settings,
  Trophy,
  Clock,
  CheckCircle,
  Star,
  Zap,
  Award,
  Eye,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { InteractiveSimulation } from '@/components/media/InteractiveSimulation';
import { ImageGallery } from '@/components/media/ImageGallery';

// Mock data for different media types
const MOCK_MEDIA_DATA: Record<string, Record<string, {
  topicName: string;
  subjectName: string;
  totalXP: number;
  estimatedTime: number;
  videos: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    duration: number;
    thumbnail?: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    points: number;
    topics: string[];
  }>;
  simulations: Array<{
    id: string;
    title: string;
    description: string;
    type: 'concrete-slump' | 'beam-loading' | 'water-flow' | 'soil-compaction';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    points: number;
    parameters: {
      name: string;
      min: number;
      max: number;
      default: number;
      unit: string;
      description: string;
    }[];
    learningObjectives: string[];
  }>;
  galleries: Array<{
    id: string;
    title: string;
    description: string;
    category: 'diagrams' | 'photos' | 'charts' | 'schematics';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    points: number;
    images: {
      id: string;
      title: string;
      description: string;
      url: string;
      thumbnail: string;
      tags: string[];
      annotations?: {
        x: number;
        y: number;
        label: string;
        description: string;
      }[];
    }[];
  }>;
}>> = {
  '1': { // Concrete Technology
    'ct-1': { // Fresh Concrete
      topicName: 'Fresh Concrete',
      subjectName: 'Concrete Technology',
      totalXP: 800,
      estimatedTime: 45,
      videos: [
        {
          id: 'video-1',
          title: 'Concrete Mixing Process',
          description: 'Learn the step-by-step process of mixing concrete for optimal workability and strength.',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Mock URL
          duration: 480, // 8 minutes
          thumbnail: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400',
          difficulty: 'Beginner',
          points: 100,
          topics: ['Mixing', 'Workability', 'Quality Control']
        },
        {
          id: 'video-2',
          title: 'Slump Test Demonstration',
          description: 'Watch a professional demonstration of the slump test procedure and result interpretation.',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Mock URL
          duration: 360, // 6 minutes
          thumbnail: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
          difficulty: 'Intermediate',
          points: 120,
          topics: ['Testing', 'Workability', 'Standards']
        }
      ],
      simulations: [
        {
          id: 'sim-1',
          title: 'Concrete Slump Calculator',
          description: 'Interactive simulation to understand how different factors affect concrete workability.',
          type: 'concrete-slump',
          difficulty: 'Intermediate',
          points: 150,
          parameters: [
            {
              name: 'Water-Cement Ratio',
              min: 0.3,
              max: 0.8,
              default: 0.5,
              unit: '',
              description: 'Ratio of water to cement by weight'
            },
            {
              name: 'Aggregate Size',
              min: 10,
              max: 40,
              default: 20,
              unit: 'mm',
              description: 'Maximum size of coarse aggregate'
            },
            {
              name: 'Temperature',
              min: 5,
              max: 40,
              default: 20,
              unit: '°C',
              description: 'Ambient temperature during mixing'
            }
          ],
          learningObjectives: [
            'Understand the relationship between W/C ratio and workability',
            'Learn how aggregate size affects concrete flow',
            'Recognize the impact of temperature on fresh concrete properties'
          ]
        },
        {
          id: 'sim-2',
          title: 'Beam Deflection Analysis',
          description: 'Calculate beam deflections under various loading conditions.',
          type: 'beam-loading',
          difficulty: 'Advanced',
          points: 200,
          parameters: [
            {
              name: 'Applied Load',
              min: 5,
              max: 50,
              default: 10,
              unit: 'kN',
              description: 'Point load applied at center of beam'
            },
            {
              name: 'Beam Length',
              min: 2,
              max: 8,
              default: 3,
              unit: 'm',
              description: 'Length of simply supported beam'
            },
            {
              name: 'Moment of Inertia',
              min: 50,
              max: 500,
              default: 100,
              unit: 'cm⁴',
              description: 'Second moment of area of beam cross-section'
            }
          ],
          learningObjectives: [
            'Apply beam deflection formulas',
            'Understand the relationship between load and deflection',
            'Learn about serviceability limit states'
          ]
        }
      ],
      galleries: [
        {
          id: 'gallery-1',
          title: 'Concrete Testing Equipment',
          description: 'Visual guide to equipment used for testing fresh and hardened concrete.',
          category: 'photos',
          difficulty: 'Beginner',
          points: 80,
          images: [
            {
              id: 'img-1',
              title: 'Slump Cone',
              description: 'Standard slump cone used for workability testing',
              url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800',
              thumbnail: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400',
              tags: ['Testing', 'Equipment', 'Workability'],
              annotations: [
                { x: 30, y: 20, label: 'Top Opening', description: '100mm diameter opening' },
                { x: 50, y: 80, label: 'Base', description: '200mm diameter base' }
              ]
            },
            {
              id: 'img-2',
              title: 'Compression Testing Machine',
              description: 'Universal testing machine for concrete cube compression tests',
              url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
              thumbnail: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
              tags: ['Testing', 'Strength', 'Equipment']
            },
            {
              id: 'img-3',
              title: 'Concrete Mixer',
              description: 'Industrial concrete mixer for large-scale production',
              url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800',
              thumbnail: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400',
              tags: ['Mixing', 'Production', 'Equipment']
            },
            {
              id: 'img-4',
              title: 'Concrete Samples',
              description: 'Various concrete cube samples prepared for testing',
              url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
              thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
              tags: ['Samples', 'Testing', 'Quality Control']
            }
          ]
        },
        {
          id: 'gallery-2',
          title: 'Concrete Mix Design Charts',
          description: 'Reference charts and diagrams for concrete mix proportioning.',
          category: 'charts',
          difficulty: 'Intermediate',
          points: 100,
          images: [
            {
              id: 'chart-1',
              title: 'Water-Cement Ratio vs Strength',
              description: 'Relationship between W/C ratio and compressive strength',
              url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
              thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
              tags: ['Charts', 'Strength', 'Mix Design']
            },
            {
              id: 'chart-2',
              title: 'Aggregate Gradation Curves',
              description: 'Particle size distribution curves for different aggregate types',
              url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
              thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
              tags: ['Aggregates', 'Gradation', 'Charts']
            }
          ]
        }
      ]
    }
  }
};

interface MediaProgress {
  videoProgress: Record<string, { progress: number; completed: boolean; points: number }>;
  simulationProgress: Record<string, { completed: boolean; points: number }>;
  galleryProgress: Record<string, { viewedImages: string[]; completed: boolean; points: number }>;
}

export default function MediaPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mediaData, setMediaData] = useState<typeof MOCK_MEDIA_DATA[string][string] | null>(null);
  const [progress, setProgress] = useState<MediaProgress>({
    videoProgress: {},
    simulationProgress: {},
    galleryProgress: {}
  });
  const [isLoading, setIsLoading] = useState(true);

  const subjectId = params.subjectId as string;
  const topicId = params.topicId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && subjectId && topicId) {
      const mockData = MOCK_MEDIA_DATA[subjectId]?.[topicId];
      
      if (!mockData) {
        router.push(`/subjects/${subjectId}/topics/${topicId}`);
        return;
      }

      setMediaData(mockData);
      setIsLoading(false);
    }
  }, [status, subjectId, topicId, router]);

  const handleVideoProgress = (videoId: string, progressValue: number, completed: boolean, points: number) => {
    setProgress(prev => ({
      ...prev,
      videoProgress: {
        ...prev.videoProgress,
        [videoId]: { progress: progressValue, completed, points }
      }
    }));
  };

  const handleSimulationComplete = (simulationId: string, interactions: number, timeSpent: number, points: number) => {
    setProgress(prev => ({
      ...prev,
      simulationProgress: {
        ...prev.simulationProgress,
        [simulationId]: { completed: true, points }
      }
    }));
  };

  const handleGalleryProgress = (galleryId: string, imagesViewed: number, timeSpent: number, points: number) => {
    setProgress(prev => ({
      ...prev,
      galleryProgress: {
        ...prev.galleryProgress,
        [galleryId]: { 
          viewedImages: [], // This would be populated with actual image IDs
          completed: true, 
          points 
        }
      }
    }));
  };

  const calculateOverallProgress = () => {
    if (!mediaData) return { completed: 0, total: 0, points: 0, maxPoints: 0 };

    const totalItems = mediaData.videos.length + mediaData.simulations.length + mediaData.galleries.length;
    let completedItems = 0;
    let earnedPoints = 0;

    // Count completed videos
    mediaData.videos.forEach(video => {
      if (progress.videoProgress[video.id]?.completed) {
        completedItems++;
        earnedPoints += progress.videoProgress[video.id].points;
      }
    });

    // Count completed simulations
    mediaData.simulations.forEach(simulation => {
      if (progress.simulationProgress[simulation.id]?.completed) {
        completedItems++;
        earnedPoints += progress.simulationProgress[simulation.id].points;
      }
    });

    // Count completed galleries
    mediaData.galleries.forEach(gallery => {
      if (progress.galleryProgress[gallery.id]?.completed) {
        completedItems++;
        earnedPoints += progress.galleryProgress[gallery.id].points;
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
          <p className="text-gray-600">Loading media content...</p>
        </div>
      </div>
    );
  }

  if (!mediaData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Media content not found</p>
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
              <Play className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">{mediaData.videos.length}</div>
              <div className="text-sm text-blue-600">Videos</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <Settings className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700">{mediaData.simulations.length}</div>
              <div className="text-sm text-purple-600">Simulations</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <ImageIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">{mediaData.galleries.length}</div>
              <div className="text-sm text-green-600">Galleries</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-700">{mediaData.estimatedTime}</div>
              <div className="text-sm text-yellow-600">Minutes</div>
            </div>
          </div>
        </motion.div>

        {/* Videos Section */}
        {mediaData.videos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Learning Videos</h2>
                <p className="text-gray-600">Watch and learn from expert demonstrations</p>
              </div>
            </div>
            
            <div className="space-y-8">
              {mediaData.videos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <VideoPlayer
                    video={video}
                    onProgress={handleVideoProgress}
                    initialProgress={progress.videoProgress[video.id]?.progress || 0}
                    isCompleted={progress.videoProgress[video.id]?.completed || false}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Simulations Section */}
        {mediaData.simulations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Interactive Simulations</h2>
                <p className="text-gray-600">Experiment with parameters and see real-time results</p>
              </div>
            </div>
            
            <div className="space-y-8">
              {mediaData.simulations.map((simulation, index) => (
                <motion.div
                  key={simulation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <InteractiveSimulation
                    simulation={simulation}
                    onComplete={handleSimulationComplete}
                    isCompleted={progress.simulationProgress[simulation.id]?.completed || false}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Galleries Section */}
        {mediaData.galleries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Image Galleries</h2>
                <p className="text-gray-600">Explore visual references and detailed diagrams</p>
              </div>
            </div>
            
            <div className="space-y-8">
              {mediaData.galleries.map((gallery, index) => (
                <motion.div
                  key={gallery.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <ImageGallery
                    gallery={gallery}
                    onComplete={handleGalleryProgress}
                    viewedImages={progress.galleryProgress[gallery.id]?.viewedImages || []}
                    isCompleted={progress.galleryProgress[gallery.id]?.completed || false}
                  />
                </motion.div>
              ))}
            </div>
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
            <h3 className="text-2xl font-bold text-green-800 mb-2">Media Content Completed!</h3>
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
  );
} 