'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Star, Zap, Brain, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlashcardProps {
  flashcard: {
    id: string;
    front: string;
    back: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    category?: string;
    tags?: string[];
    imageUrl?: string;
    masteryLevel: 'New' | 'Learning' | 'Familiar' | 'Mastered';
    reviewCount: number;
    lastReviewed?: Date;
  };
  onMasteryUpdate: (flashcardId: string, newLevel: 'Again' | 'Hard' | 'Good' | 'Easy') => void;
  showControls?: boolean;
  showHeader?: boolean;
}

export function FlashcardComponent({
  flashcard,
  onMasteryUpdate,
  showControls = true,
  showHeader = true
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMasteryClick = (level: 'Again' | 'Hard' | 'Good' | 'Easy') => {
    onMasteryUpdate(flashcard.id, level);
    // Keep card flipped - let the parent component handle progression
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'from-green-500 to-emerald-600';
      case 'Intermediate': return 'from-yellow-500 to-orange-600';
      case 'Advanced': return 'from-red-500 to-pink-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'Mastered': return 'from-green-500 to-emerald-600';
      case 'Familiar': return 'from-blue-500 to-cyan-600';
      case 'Learning': return 'from-yellow-500 to-orange-600';
      case 'New': return 'from-gray-400 to-gray-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getMasteryIcon = (level: string) => {
    switch (level) {
      case 'Mastered': return <Star className="w-4 h-4" />;
      case 'Familiar': return <Zap className="w-4 h-4" />;
      case 'Learning': return <Brain className="w-4 h-4" />;
      case 'New': return <Eye className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Flashcard Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getDifficultyColor(flashcard.difficulty)}`}>
              {flashcard.difficulty}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getMasteryColor(flashcard.masteryLevel)} flex items-center gap-1`}>
              {getMasteryIcon(flashcard.masteryLevel)}
              {flashcard.masteryLevel}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Reviewed {flashcard.reviewCount} times
          </div>
        </div>
      )}

      {/* Flashcard Container */}
      <div className="relative h-80 perspective-1000">
        <motion.div
          className="relative w-full h-full cursor-pointer"
          onClick={handleFlip}
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Front Side */}
          <motion.div
            className="absolute inset-0 w-full h-full backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-600 rounded-xl shadow-lg border border-indigo-200 p-8 flex flex-col justify-center items-center text-white">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
              </div>

              <div className="relative text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 leading-relaxed">
                  {flashcard.front}
                </h3>

                {flashcard.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={flashcard.imageUrl}
                      alt="Flashcard illustration"
                      className="max-w-full h-32 object-contain mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}

                {flashcard.category && (
                  <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                    {flashcard.category}
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                  <RotateCcw className="w-4 h-4" />
                  <span>Click to reveal answer</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Back Side */}
          <motion.div
            className="absolute inset-0 w-full h-full backface-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-xl shadow-lg border border-emerald-200 p-8 flex flex-col justify-center items-center text-white">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
              </div>

              <div className="relative text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="text-lg leading-relaxed mb-6">
                  {flashcard.back}
                </div>

                {flashcard.tags && flashcard.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {flashcard.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                  <RotateCcw className="w-4 h-4" />
                  <span>Click to flip back</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Mastery Controls */}
      {showControls && isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">How well did you know this?</h4>
            <p className="text-sm text-gray-600">Your answer affects when you'll see this card again</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => handleMasteryClick('Again')}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 py-3"
            >
              <div className="text-center">
                <div className="font-semibold">Again</div>
                <div className="text-xs opacity-80">&lt; 1min</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleMasteryClick('Hard')}
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 py-3"
            >
              <div className="text-center">
                <div className="font-semibold">Hard</div>
                <div className="text-xs opacity-80">6min</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleMasteryClick('Good')}
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 py-3"
            >
              <div className="text-center">
                <div className="font-semibold">Good</div>
                <div className="text-xs opacity-80">1day</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleMasteryClick('Easy')}
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 py-3"
            >
              <div className="text-center">
                <div className="font-semibold">Easy</div>
                <div className="text-xs opacity-80">4days</div>
              </div>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
} 