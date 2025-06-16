'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft,
  Trophy,
  Target,
  Clock,
  Star,
  Zap,
  Award,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Brain,
  Shuffle,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlashcardDeck } from '@/components/flashcards/FlashcardDeck';

// Mock data for flashcards
const MOCK_FLASHCARDS_DATA: Record<string, Record<string, {
  topicName: string;
  subjectName: string;
  flashcards: Array<{
    id: string;
    front: string;
    back: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    category?: string;
    tags?: string[];
    masteryLevel: 'New' | 'Learning' | 'Familiar' | 'Mastered';
    reviewCount: number;
    lastReviewed?: Date;
  }>;
  totalXP: number;
  estimatedTime: number;
}>> = {
  '1': { // Concrete Technology
    'ct-1': { // Fresh Concrete
      topicName: 'Fresh Concrete',
      subjectName: 'Concrete Technology',
      totalXP: 400,
      estimatedTime: 20,
      flashcards: [
        {
          id: 'fc-1',
          front: 'What is workability in concrete?',
          back: 'Workability is the ease with which concrete can be mixed, transported, placed, and compacted without segregation or bleeding. It depends on water content, aggregate properties, and admixtures.',
          difficulty: 'Beginner',
          category: 'Properties',
          tags: ['workability', 'fresh-concrete', 'properties'],
          masteryLevel: 'New',
          reviewCount: 0
        },
        {
          id: 'fc-2',
          front: 'What is the slump test used for?',
          back: 'The slump test measures the consistency and workability of fresh concrete. A higher slump indicates more fluid concrete, while lower slump indicates stiffer concrete.',
          difficulty: 'Beginner',
          category: 'Testing',
          tags: ['slump-test', 'testing', 'workability'],
          masteryLevel: 'Learning',
          reviewCount: 2
        },
        {
          id: 'fc-3',
          front: 'What is bleeding in concrete?',
          back: 'Bleeding is the tendency of water to rise to the surface of freshly placed concrete. It occurs when cement particles settle and water moves upward, potentially weakening the surface.',
          difficulty: 'Intermediate',
          category: 'Defects',
          tags: ['bleeding', 'defects', 'water'],
          masteryLevel: 'Familiar',
          reviewCount: 5
        },
        {
          id: 'fc-4',
          front: 'What is segregation in concrete?',
          back: 'Segregation is the separation of concrete ingredients, typically when coarse aggregates separate from the mortar. It can occur during mixing, transportation, or placement.',
          difficulty: 'Intermediate',
          category: 'Defects',
          tags: ['segregation', 'defects', 'aggregates'],
          masteryLevel: 'New',
          reviewCount: 0
        },
        {
          id: 'fc-5',
          front: 'What are the factors affecting workability?',
          back: 'Key factors include: water-cement ratio, aggregate size and shape, cement fineness, admixtures, temperature, and time. Higher water content generally increases workability but reduces strength.',
          difficulty: 'Advanced',
          category: 'Properties',
          tags: ['workability', 'factors', 'water-cement-ratio'],
          masteryLevel: 'Learning',
          reviewCount: 3
        },
        {
          id: 'fc-6',
          front: 'What is the purpose of admixtures in concrete?',
          back: 'Admixtures modify concrete properties such as workability, setting time, durability, and strength. Common types include plasticizers, accelerators, retarders, and air-entraining agents.',
          difficulty: 'Intermediate',
          category: 'Admixtures',
          tags: ['admixtures', 'plasticizers', 'properties'],
          masteryLevel: 'Mastered',
          reviewCount: 8
        },
        {
          id: 'fc-7',
          front: 'What is the water-cement ratio?',
          back: 'The water-cement ratio (W/C) is the weight of water divided by the weight of cement in a concrete mix. It directly affects concrete strength, durability, and workability.',
          difficulty: 'Beginner',
          category: 'Mix Design',
          tags: ['water-cement-ratio', 'strength', 'mix-design'],
          masteryLevel: 'Familiar',
          reviewCount: 4
        },
        {
          id: 'fc-8',
          front: 'What is the setting time of concrete?',
          back: 'Setting time is when concrete changes from plastic to solid state. Initial set (30-60 min) is when concrete starts to harden; final set (6-10 hours) is when it becomes rigid.',
          difficulty: 'Advanced',
          category: 'Properties',
          tags: ['setting-time', 'hardening', 'initial-set'],
          masteryLevel: 'New',
          reviewCount: 0
        }
      ]
    }
  }
};

interface StudySession {
  mode: 'study' | 'review' | 'browse';
  startTime: number;
  cardsStudied: number;
  xpEarned: number;
}

export default function FlashcardsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [flashcardsData, setFlashcardsData] = useState<typeof MOCK_FLASHCARDS_DATA[string][string] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studyMode, setStudyMode] = useState<'menu' | 'study' | 'review' | 'browse'>('menu');
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const subjectId = params.subjectId as string;
  const topicId = params.topicId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && subjectId && topicId) {
      const mockData = MOCK_FLASHCARDS_DATA[subjectId]?.[topicId];
      
      if (!mockData) {
        router.push(`/subjects/${subjectId}/topics/${topicId}`);
        return;
      }

      setFlashcardsData(mockData);
      setIsLoading(false);
    }
  }, [status, subjectId, topicId, router]);

  const handleStartStudy = (mode: 'study' | 'review' | 'browse') => {
    setStudyMode(mode);
    setStudySession({
      mode,
      startTime: Date.now(),
      cardsStudied: 0,
      xpEarned: 0
    });
    setSessionCompleted(false);
  };

  const handleMasteryUpdate = (flashcardId: string, newLevel: 'Again' | 'Hard' | 'Good' | 'Easy') => {
    // Update flashcard mastery level based on response
    if (flashcardsData) {
      const updatedFlashcards = flashcardsData.flashcards.map(card => {
        if (card.id === flashcardId) {
          let newMasteryLevel: 'New' | 'Learning' | 'Familiar' | 'Mastered' = card.masteryLevel;
          
          switch (newLevel) {
            case 'Again':
              newMasteryLevel = 'New';
              break;
            case 'Hard':
              newMasteryLevel = 'Learning';
              break;
            case 'Good':
              if (card.masteryLevel === 'New') newMasteryLevel = 'Learning';
              else if (card.masteryLevel === 'Learning') newMasteryLevel = 'Familiar';
              break;
            case 'Easy':
              if (card.masteryLevel === 'New' || card.masteryLevel === 'Learning') newMasteryLevel = 'Familiar';
              else if (card.masteryLevel === 'Familiar') newMasteryLevel = 'Mastered';
              break;
          }

          return {
            ...card,
            masteryLevel: newMasteryLevel,
            reviewCount: card.reviewCount + 1,
            lastReviewed: new Date()
          };
        }
        return card;
      });

      setFlashcardsData({
        ...flashcardsData,
        flashcards: updatedFlashcards
      });

      // Update session stats
      if (studySession) {
        const xpGained = newLevel === 'Easy' ? 20 : newLevel === 'Good' ? 15 : newLevel === 'Hard' ? 10 : 5;
        setStudySession({
          ...studySession,
          cardsStudied: studySession.cardsStudied + 1,
          xpEarned: studySession.xpEarned + xpGained
        });
      }
    }
  };

  const handleSessionComplete = () => {
    setSessionCompleted(true);
    setStudyMode('menu');
  };

  const getFilteredCards = () => {
    if (!flashcardsData) return [];
    
    switch (studyMode) {
      case 'review':
        return flashcardsData.flashcards.filter(card => 
          card.masteryLevel === 'Learning' || card.masteryLevel === 'Familiar'
        );
      case 'study':
      case 'browse':
      default:
        return flashcardsData.flashcards;
    }
  };

  const getStudyStats = () => {
    if (!flashcardsData) return { total: 0, new: 0, learning: 0, familiar: 0, mastered: 0 };
    
    const stats = flashcardsData.flashcards.reduce((acc, card) => {
      acc.total++;
      acc[card.masteryLevel.toLowerCase() as keyof typeof acc]++;
      return acc;
    }, { total: 0, new: 0, learning: 0, familiar: 0, mastered: 0 });

    return stats;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (!flashcardsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Flashcards not found</p>
        </div>
      </div>
    );
  }

  if (sessionCompleted && studySession) {
    const timeSpent = Math.round((Date.now() - studySession.startTime) / 1000 / 60);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href={`/subjects/${subjectId}/topics/${topicId}`}
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {flashcardsData.topicName}
            </Link>
          </div>

          {/* Results Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center"
          >
            <div className="mb-6">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Session Complete!</h1>
              <p className="text-gray-600">Great job studying {flashcardsData.topicName} flashcards</p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">{studySession.cardsStudied}</div>
                <div className="text-sm text-green-600">Cards Studied</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-700">{studySession.xpEarned}</div>
                <div className="text-sm text-purple-600">XP Earned</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700">{timeSpent}</div>
                <div className="text-sm text-orange-600">Minutes</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setSessionCompleted(false)}
                variant="outline"
                className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Study Again
              </Button>
              <Link href={`/subjects/${subjectId}/topics/${topicId}`}>
                <Button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-700 hover:via-purple-700 hover:to-cyan-700 text-white">
                  Continue Learning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (studyMode !== 'menu') {
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
              Back to {flashcardsData.topicName}
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{flashcardsData.topicName} Flashcards</h1>
                <p className="text-gray-600">{flashcardsData.subjectName}</p>
              </div>
              <Button
                onClick={() => setStudyMode('menu')}
                variant="outline"
                className="border-gray-300 hover:border-gray-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
            </div>
          </div>

          {/* Flashcard Deck */}
          <FlashcardDeck
            flashcards={getFilteredCards()}
            onMasteryUpdate={handleMasteryUpdate}
            onComplete={handleSessionComplete}
            mode={studyMode}
          />
        </div>
      </div>
    );
  }

  const stats = getStudyStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/subjects/${subjectId}/topics/${topicId}`}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {flashcardsData.topicName}
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{flashcardsData.topicName} Flashcards</h1>
            <p className="text-gray-600 mb-6">{flashcardsData.subjectName}</p>
          </div>
        </div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Your Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-600">Total Cards</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <Brain className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.new}</div>
              <div className="text-sm text-gray-600">New</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <Zap className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-900">{stats.learning}</div>
              <div className="text-sm text-yellow-600">Learning</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <Star className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{stats.familiar}</div>
              <div className="text-sm text-blue-600">Familiar</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <Trophy className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{stats.mastered}</div>
              <div className="text-sm text-green-600">Mastered</div>
            </div>
          </div>
        </motion.div>

        {/* Study Mode Selection */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Study Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-600 rounded-xl shadow-lg border border-indigo-200 p-6 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                 onClick={() => handleStartStudy('study')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Study All Cards</h3>
                <p className="text-white/90 text-sm mb-4">Learn new cards and review all flashcards</p>
                <div className="text-sm text-white/80">
                  {stats.total} cards • ~{flashcardsData.estimatedTime} min
                </div>
              </div>
            </div>
          </motion.div>

          {/* Review Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-xl shadow-lg border border-emerald-200 p-6 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                 onClick={() => handleStartStudy('review')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Review Session</h3>
                <p className="text-white/90 text-sm mb-4">Focus on learning and familiar cards</p>
                <div className="text-sm text-white/80">
                  {stats.learning + stats.familiar} cards • ~{Math.round((stats.learning + stats.familiar) * 2)} min
                </div>
              </div>
            </div>
          </motion.div>

          {/* Browse Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 rounded-xl shadow-lg border border-orange-200 p-6 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                 onClick={() => handleStartStudy('browse')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Browse Cards</h3>
                <p className="text-white/90 text-sm mb-4">Explore cards without tracking progress</p>
                <div className="text-sm text-white/80">
                  {stats.total} cards • No time limit
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 