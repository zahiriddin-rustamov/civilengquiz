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
import { FlashcardTable } from '@/components/flashcards/FlashcardTable';
import { SurveyForm } from '@/components/surveys';

// Enhanced flashcards data type for UI
interface FlashcardsData {
  topicName: string;
  subjectName: string;
  imageUrl?: string;
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
}

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
  const [flashcardsData, setFlashcardsData] = useState<FlashcardsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<'menu' | 'study' | 'review' | 'browse'>('menu');
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionCards, setSessionCards] = useState<typeof flashcardsData.flashcards>([]);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyData, setSurveyData] = useState<any>(null);

  const subjectId = params.subjectId as string;
  const topicId = params.topicId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && subjectId && topicId) {
      fetchFlashcards();
    }
  }, [status, subjectId, topicId, router]);

  const fetchFlashcards = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/topics/${topicId}/flashcards`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push(`/subjects/${subjectId}/topics/${topicId}`);
          return;
        }
        throw new Error('Failed to fetch flashcards');
      }

      const data = await response.json();
      setFlashcardsData(data);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartStudy = (mode: 'study' | 'review' | 'browse') => {
    // Scroll to top when starting a new session
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setStudyMode(mode);
    setStudySession({
      mode,
      startTime: Date.now(),
      cardsStudied: 0,
      xpEarned: 0
    });
    setSessionCompleted(false);

    // Generate session cards once when starting
    if (flashcardsData) {
      let cards = [];
      switch (mode) {
        case 'review':
          cards = flashcardsData.flashcards.filter(card =>
            card.masteryLevel === 'Learning' || card.masteryLevel === 'Familiar'
          );
          break;
        case 'study':
        case 'browse':
        default:
          cards = flashcardsData.flashcards;
          break;
      }

      // Randomize for study and review modes
      if (mode === 'study' || mode === 'review') {
        cards = [...cards].sort(() => Math.random() - 0.5);
      }

      setSessionCards(cards);
    }
  };

  const handleMasteryUpdate = async (flashcardId: string, newLevel: 'Again' | 'Hard' | 'Good' | 'Easy') => {
    // Update flashcard mastery level based on response
    if (flashcardsData) {
      const card = flashcardsData.flashcards.find(c => c.id === flashcardId);
      if (!card) return;

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

      // Calculate score based on response (for XP calculation)
      const score = newLevel === 'Easy' ? 1 : newLevel === 'Good' ? 0.8 : newLevel === 'Hard' ? 0.6 : 0.2;

      try {
        // Update progress and get real XP from server
        const response = await fetch('/api/user/progress/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId: flashcardId,
            contentType: 'flashcard',
            topicId: topicId,
            subjectId: subjectId,
            completed: true,
            score: score,
            timeSpent: 30, // Approximate time per flashcard in seconds
            data: {
              masteryLevel: newMasteryLevel,
              responseLevel: newLevel,
              difficulty: card.difficulty
            }
          }),
        });

        const result = await response.json();

        // Update local state
        const updatedFlashcards = flashcardsData.flashcards.map(c => {
          if (c.id === flashcardId) {
            return {
              ...c,
              masteryLevel: newMasteryLevel,
              reviewCount: c.reviewCount + 1,
              lastReviewed: new Date()
            };
          }
          return c;
        });

        // Update both the main flashcards data and session cards
        setFlashcardsData({
          ...flashcardsData,
          flashcards: updatedFlashcards
        });

        // Also update the session cards to reflect the changes
        const updatedSessionCards = sessionCards.map(c => {
          const updatedCard = updatedFlashcards.find(fc => fc.id === c.id);
          return updatedCard || c;
        });
        setSessionCards(updatedSessionCards);

        // Update session stats with real XP from server
        if (studySession && result.success) {
          setStudySession({
            ...studySession,
            cardsStudied: studySession.cardsStudied + 1,
            xpEarned: studySession.xpEarned + (result.xpEarned || 0)
          });
        }
      } catch (error) {
        console.error('Error updating flashcard progress:', error);

        // Fallback: still update local state even if API fails
        const updatedFlashcards = flashcardsData.flashcards.map(c => {
          if (c.id === flashcardId) {
            return {
              ...c,
              masteryLevel: newMasteryLevel,
              reviewCount: c.reviewCount + 1,
              lastReviewed: new Date()
            };
          }
          return c;
        });

        setFlashcardsData({
          ...flashcardsData,
          flashcards: updatedFlashcards
        });

        const updatedSessionCards = sessionCards.map(c => {
          const updatedCard = updatedFlashcards.find(fc => fc.id === c.id);
          return updatedCard || c;
        });
        setSessionCards(updatedSessionCards);

        // Update session stats with fallback (no XP if API fails)
        if (studySession) {
          setStudySession({
            ...studySession,
            cardsStudied: studySession.cardsStudied + 1,
            xpEarned: studySession.xpEarned // No XP gained if API fails
          });
        }
      }
    }
  };

  const handleSessionComplete = () => {
    setSessionCompleted(true);
    setStudyMode('menu');
    // Scroll to top when completing session
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Only check for survey after completing "Study All Cards" session
    if (studySession?.mode === 'study') {
      checkForSurvey();
    }
  };

  const checkForSurvey = async () => {
    try {
      const response = await fetch(`/api/surveys/trigger?triggerType=flashcard_completion&contentId=${topicId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.survey && !data.alreadyCompleted) {
          setSurveyData(data);
        }
      }
    } catch (error) {
      console.error('Error checking for survey:', error);
    }
  };

  const handleSurveyComplete = () => {
    setSurveyData(null);
  };

  const getFilteredCards = () => {
    // Return the stable session cards if we're in a study session
    if (studyMode !== 'menu' && sessionCards.length > 0) {
      return sessionCards;
    }

    // Fallback for menu mode or if session cards aren't set yet
    if (!flashcardsData) return [];
    return flashcardsData.flashcards;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Flashcards</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchFlashcards} variant="outline">
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

  if (!flashcardsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Flashcards not found</p>
          <Button asChild className="mt-4">
            <Link href={`/subjects/${subjectId}/topics/${topicId}`}>Back to Topic</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (sessionCompleted && studySession) {
    const timeSpent = Math.round((Date.now() - studySession.startTime) / 1000 / 60);

    return (
      <div className="min-h-screen">
        {/* Modern Banner */}
        <div className="relative h-80 overflow-hidden">
          {flashcardsData.imageUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${flashcardsData.imageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-700 to-indigo-800" />
          )}

          <div className="relative h-full flex flex-col justify-center px-4">
            <div className="max-w-6xl mx-auto w-full">
              <Link
                href={`/subjects/${subjectId}/topics/${topicId}`}
                className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm mb-6 transition-all duration-300 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 hover:bg-white/15 shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to {flashcardsData.topicName}
              </Link>

              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{flashcardsData.topicName} Flashcards</h1>
                <p className="text-white/80 text-lg mb-6">{flashcardsData.subjectName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 py-8">
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

            {/* Survey Section */}
            {surveyData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
              >
                <SurveyForm
                  survey={surveyData.survey}
                  triggerContentId={surveyData.triggerContentId}
                  onSubmitSuccess={handleSurveyComplete}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (studyMode !== 'menu') {
    return (
      <div className="min-h-screen">
        {/* Modern Banner */}
        <div className="relative h-80 overflow-hidden">
          {flashcardsData.imageUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${flashcardsData.imageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-700 to-indigo-800" />
          )}

          <div className="relative h-full flex flex-col justify-center px-4">
            <div className="max-w-6xl mx-auto w-full">
              <button
                onClick={() => setStudyMode('menu')}
                className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm mb-6 transition-all duration-300 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 hover:bg-white/15 shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Flashcards
              </button>

              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {studyMode === 'study' && 'Study Session'}
                  {studyMode === 'review' && 'Review Session'}
                  {studyMode === 'browse' && 'Browse Cards'}
                </h1>
                <p className="text-white/80 text-lg">{flashcardsData.topicName} • {flashcardsData.subjectName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Flashcard Content */}
            {studyMode === 'browse' ? (
              <FlashcardTable flashcards={getFilteredCards()} />
            ) : (
              <FlashcardDeck
                flashcards={getFilteredCards()}
                onMasteryUpdate={handleMasteryUpdate}
                onComplete={handleSessionComplete}
                mode={studyMode}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  const stats = getStudyStats();

  return (
    <div className="min-h-screen">
      {/* Modern Banner */}
      <div className="relative h-80 overflow-hidden">
        {flashcardsData.imageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${flashcardsData.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-700 to-indigo-800" />
        )}

        <div className="relative h-full flex flex-col justify-center px-4">
          <div className="max-w-6xl mx-auto w-full">
            <Link
              href={`/subjects/${subjectId}/topics/${topicId}`}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm mb-6 transition-all duration-300 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 hover:bg-white/15 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {flashcardsData.topicName}
            </Link>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-8 items-center">
              {/* Left Column - Title */}
              <div className="lg:col-span-2">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{flashcardsData.topicName} Flashcards</h1>
                <p className="text-white/80 text-lg mb-4">{flashcardsData.subjectName}</p>

                {/* Progress indicator */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/90 font-medium text-sm">Mastery Progress</span>
                    <span className="font-bold text-white">{stats.mastered}/{stats.total}</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${stats.total > 0 ? (stats.mastered / stats.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Key Stats */}
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Target className="w-4 h-4 text-white" />
                    <span className="text-white/70 font-medium text-xs">Total Cards</span>
                  </div>
                  <div className="text-xl font-bold text-white">{stats.total}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                    <Trophy className="w-4 h-4 text-white mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{stats.mastered}</div>
                    <div className="text-white/70 text-xs">Mastered</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                    <Brain className="w-4 h-4 text-white mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{stats.learning + stats.familiar}</div>
                    <div className="text-white/70 text-xs">Learning</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* Study Mode Selection */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Study Mode */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="group relative bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6 hover:bg-white/90 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer h-60 flex flex-col justify-between overflow-hidden"
                   onClick={() => handleStartStudy('study')}>
                {/* Gradient background overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-600/20 to-cyan-600/20 group-hover:from-indigo-500/30 group-hover:via-purple-600/30 group-hover:to-cyan-600/30 transition-all duration-300" />

                <div className="relative text-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Study All Cards</h3>
                  <div className="h-10 flex items-center justify-center">
                    <p className="text-gray-600 text-sm leading-relaxed">Learn new and review cards with spaced repetition</p>
                  </div>
                </div>
                <div className="relative text-sm text-gray-500 text-center bg-gray-50/50 rounded-xl px-3 py-2 backdrop-blur-sm border border-gray-200/50 mt-2">
                  {stats.total} cards • ~{flashcardsData.estimatedTime} min
                </div>
              </div>
            </motion.div>

            {/* Review Mode */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="group relative bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6 hover:bg-white/90 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer h-60 flex flex-col justify-between overflow-hidden"
                   onClick={() => handleStartStudy('review')}>
                {/* Gradient background overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-600/20 to-cyan-600/20 group-hover:from-emerald-500/30 group-hover:via-teal-600/30 group-hover:to-cyan-600/30 transition-all duration-300" />

                <div className="relative text-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <RotateCcw className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Review Session</h3>
                  <div className="h-10 flex items-center justify-center">
                    <p className="text-gray-600 text-sm leading-relaxed">Focus on cards that need more practice</p>
                  </div>
                </div>
                <div className="relative text-sm text-gray-500 text-center bg-gray-50/50 rounded-xl px-3 py-2 backdrop-blur-sm border border-gray-200/50 mt-2">
                  {stats.learning + stats.familiar} cards • ~{Math.round((stats.learning + stats.familiar) * 2)} min
                </div>
              </div>
            </motion.div>

            {/* Browse Mode */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="group relative bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6 hover:bg-white/90 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer h-60 flex flex-col justify-between overflow-hidden"
                   onClick={() => handleStartStudy('browse')}>
                {/* Gradient background overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-amber-600/20 to-yellow-600/20 group-hover:from-orange-500/30 group-hover:via-amber-600/30 group-hover:to-yellow-600/30 transition-all duration-300" />

                <div className="relative text-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Browse Cards</h3>
                  <div className="h-10 flex items-center justify-center">
                    <p className="text-gray-600 text-sm leading-relaxed">Explore all cards in table format</p>
                  </div>
                </div>
                <div className="relative text-sm text-gray-500 text-center bg-gray-50/50 rounded-xl px-3 py-2 backdrop-blur-sm border border-gray-200/50 mt-2">
                  {stats.total} cards • Reference mode
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}