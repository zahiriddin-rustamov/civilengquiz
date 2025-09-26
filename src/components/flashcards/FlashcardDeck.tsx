'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw, Star, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlashcardComponent } from './FlashcardComponent';

interface FlashcardDeckProps {
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
  onMasteryUpdate: (flashcardId: string, newLevel: 'Again' | 'Hard' | 'Good' | 'Easy') => void;
  onComplete?: () => void;
  mode?: 'study' | 'review' | 'browse';
}

export function FlashcardDeck({
  flashcards,
  onMasteryUpdate,
  onComplete,
  mode = 'study'
}: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledCards, setShuffledCards] = useState(flashcards);
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());
  const [direction, setDirection] = useState(0);

  // Update shuffled cards when flashcards prop changes, but preserve position if only mastery changed
  useEffect(() => {
    // Check if this is just a mastery level update vs a complete card set change
    const isMasteryUpdate = shuffledCards.length === flashcards.length &&
                           shuffledCards.every(card => flashcards.find(fc => fc.id === card.id));

    if (isMasteryUpdate) {
      // Just update the card data without resetting position
      setShuffledCards(flashcards);
    } else {
      // Complete reset for new card set
      setShuffledCards(flashcards);
      setCurrentIndex(0);
      setStudiedCards(new Set());
    }
  }, [flashcards, shuffledCards]);

  const currentCard = shuffledCards[currentIndex];
  const progress = ((currentIndex + 1) / shuffledCards.length) * 100;

  const handleNext = () => {
    if (currentIndex < shuffledCards.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setStudiedCards(new Set());
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setStudiedCards(new Set());
    setShuffledCards(flashcards);
  };

  const handleMasteryUpdate = (flashcardId: string, newLevel: 'Again' | 'Hard' | 'Good' | 'Easy') => {
    setStudiedCards(prev => new Set([...prev, flashcardId]));
    onMasteryUpdate(flashcardId, newLevel);
    
    // Auto-advance after rating (except for "Again")
    if (newLevel !== 'Again') {
      setTimeout(() => {
        handleNext();
      }, 500);
    }
  };

  const getStudyStats = () => {
    const total = shuffledCards.length;
    const studied = studiedCards.size;
    const remaining = total - studied;
    const masteredCount = shuffledCards.filter(card => card.masteryLevel === 'Mastered').length;
    
    return { total, studied, remaining, masteredCount };
  };

  const stats = getStudyStats();

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8
    })
  };

  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">No flashcards available</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'study' && 'Study Session'}
            {mode === 'review' && 'Review Session'}
            {mode === 'browse' && 'Browse Cards'}
          </h2>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleShuffle}
              variant="outline"
              size="sm"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Shuffle
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{currentIndex + 1} of {shuffledCards.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Studied</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{stats.studied}</div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Remaining</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">{stats.remaining}</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Mastered</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{stats.masteredCount}</div>
          </div>
        </div>
      </div>

      {/* Flashcard Container */}
      <div className="relative mb-8">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentCard.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
          >
            <FlashcardComponent
              flashcard={currentCard}
              onMasteryUpdate={handleMasteryUpdate}
              showControls={mode !== 'browse'}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          className="border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Card {currentIndex + 1} of {shuffledCards.length}</span>
          {studiedCards.has(currentCard.id) && (
            <div className="flex items-center gap-1 text-green-600">
              <Zap className="w-4 h-4" />
              <span>Studied</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={currentIndex === shuffledCards.length - 1 && !onComplete}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-700 hover:via-purple-700 hover:to-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentIndex === shuffledCards.length - 1 ? 'Complete' : 'Next'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
} 