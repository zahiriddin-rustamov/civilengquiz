'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MatchingQuestionProps {
  question: {
    id: string;
    text: string;
    pairs: {
      id: string;
      left: string;
      right: string;
    }[];
    explanation?: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    points: number;
  };
  onAnswer: (questionId: string, matches: Record<string, string>, isCorrect: boolean, points: number) => void;
  showResult?: boolean;
  selectedMatches?: Record<string, string>;
  isCorrect?: boolean;
}

export function MatchingQuestion({ 
  question, 
  onAnswer, 
  showResult = false, 
  selectedMatches = {},
  isCorrect 
}: MatchingQuestionProps) {
  const [matches, setMatches] = useState<Record<string, string>>(selectedMatches);
  const [hasAnswered, setHasAnswered] = useState(showResult);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<Record<string, boolean>>({});

  // Shuffle the right side options for display
  const [shuffledRightOptions] = useState(() => {
    const rightOptions = question.pairs.map(pair => ({ id: pair.id, text: pair.right }));
    return rightOptions.sort(() => Math.random() - 0.5);
  });

  const handleLeftClick = (leftId: string) => {
    if (hasAnswered) return;
    setSelectedLeft(selectedLeft === leftId ? null : leftId);
  };

  const handleRightClick = (rightId: string) => {
    if (hasAnswered || !selectedLeft) return;
    
    const newMatches = { ...matches };
    
    // Remove any existing match for this left item
    delete newMatches[selectedLeft];
    
    // Remove any existing match for this right item
    Object.keys(newMatches).forEach(key => {
      if (newMatches[key] === rightId) {
        delete newMatches[key];
      }
    });
    
    // Add new match
    newMatches[selectedLeft] = rightId;
    
    setMatches(newMatches);
    setSelectedLeft(null);
  };

  const handleReset = () => {
    if (hasAnswered) return;
    setMatches({});
    setSelectedLeft(null);
  };

  const checkAnswers = (): Record<string, boolean> => {
    const results: Record<string, boolean> = {};
    question.pairs.forEach(pair => {
      results[pair.id] = matches[pair.id] === pair.id;
    });
    return results;
  };

  const handleSubmit = () => {
    if (hasAnswered) return;
    
    const results = checkAnswers();
    const allCorrect = Object.values(results).every(result => result);
    
    setMatchResults(results);
    setHasAnswered(true);
    onAnswer(question.id, matches, allCorrect, allCorrect ? question.points : 0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'from-green-500 to-emerald-600';
      case 'Intermediate': return 'from-yellow-500 to-orange-600';
      case 'Advanced': return 'from-red-500 to-pink-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getLeftItemStyle = (leftId: string) => {
    const isSelected = selectedLeft === leftId;
    const isMatched = matches[leftId];
    
    if (!hasAnswered) {
      if (isSelected) return 'border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg';
      if (isMatched) return 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50';
      return 'border-gray-200 hover:border-indigo-300 hover:shadow-md';
    }

    // Show results
    const isCorrect = matchResults[leftId];
    return isCorrect 
      ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg'
      : 'border-red-400 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg';
  };

  const getRightItemStyle = (rightId: string) => {
    const isMatched = Object.values(matches).includes(rightId);
    const matchingLeftId = Object.keys(matches).find(key => matches[key] === rightId);
    
    if (!hasAnswered) {
      if (isMatched) return 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50';
      return 'border-gray-200 hover:border-indigo-300 hover:shadow-md';
    }

    // Show results
    if (matchingLeftId) {
      const isCorrect = matchResults[matchingLeftId];
      return isCorrect 
        ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg'
        : 'border-red-400 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg';
    }

    return 'border-gray-200 bg-gray-50';
  };

  const getMatchIcon = (leftId: string) => {
    if (!hasAnswered) return null;
    
    const isCorrect = matchResults[leftId];
    return isCorrect 
      ? <CheckCircle className="w-5 h-5 text-green-600" />
      : <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  const getRightOptionText = (rightId: string) => {
    return shuffledRightOptions.find(option => option.id === rightId)?.text || '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
    >
      {/* Question Header */}
      <div className="flex items-center justify-between mb-6">
        <div className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getDifficultyColor(question.difficulty)}`}>
          {question.difficulty}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{question.points} XP</span>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
          {question.text}
        </h3>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          Click on a term from the left column, then click on its matching definition from the right column.
        </p>
      </div>

      {/* Matching Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 text-center">Terms</h4>
          {question.pairs.map((pair) => (
            <motion.button
              key={pair.id}
              whileHover={!hasAnswered ? { scale: 1.02 } : {}}
              whileTap={!hasAnswered ? { scale: 0.98 } : {}}
              onClick={() => handleLeftClick(pair.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left flex items-center justify-between ${getLeftItemStyle(pair.id)}`}
              disabled={hasAnswered}
            >
              <span className="text-gray-800 font-medium">{pair.left}</span>
              <div className="flex items-center gap-2">
                {matches[pair.id] && <ArrowRight className="w-4 h-4 text-gray-500" />}
                {getMatchIcon(pair.id)}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 text-center">Definitions</h4>
          {shuffledRightOptions.map((option) => (
            <motion.button
              key={option.id}
              whileHover={!hasAnswered ? { scale: 1.02 } : {}}
              whileTap={!hasAnswered ? { scale: 0.98 } : {}}
              onClick={() => handleRightClick(option.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${getRightItemStyle(option.id)}`}
              disabled={hasAnswered || !selectedLeft}
            >
              <span className="text-gray-800 font-medium">{option.text}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      {!hasAnswered && (
        <div className="flex gap-3">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1 border-gray-300 hover:border-gray-400"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(matches).length !== question.pairs.length}
            className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-700 hover:via-purple-700 hover:to-cyan-700 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answer
          </Button>
        </div>
      )}

      {/* Results Summary */}
      {hasAnswered && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
        >
          <h4 className="font-semibold text-gray-900 mb-3">Correct Matches:</h4>
          <div className="space-y-2">
            {question.pairs.map((pair) => (
              <div key={pair.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-800 font-medium">{pair.left}</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-800">{pair.right}</span>
                {matchResults[pair.id] ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Explanation */}
      {hasAnswered && question.explanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200"
        >
          <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
          <p className="text-blue-800 text-sm leading-relaxed">{question.explanation}</p>
        </motion.div>
      )}
    </motion.div>
  );
} 