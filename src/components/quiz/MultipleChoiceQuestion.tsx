'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MultipleChoiceQuestionProps {
  question: {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    points: number;
  };
  onAnswer: (questionId: string, selectedAnswer: number, isCorrect: boolean, points: number) => void;
  showResult?: boolean;
  selectedAnswer?: number;
  isCorrect?: boolean;
}

export function MultipleChoiceQuestion({
  question,
  onAnswer,
  showResult = false,
  selectedAnswer,
  isCorrect
}: MultipleChoiceQuestionProps) {
  const [selected, setSelected] = useState<number | null>(selectedAnswer ?? null);
  const [hasAnswered, setHasAnswered] = useState(showResult);

  // Randomize options while preserving correct answer mapping
  const [shuffledOptions] = useState(() => {
    const optionsWithIndex = question.options.map((option, index) => ({ option, originalIndex: index }));
    const shuffled = optionsWithIndex.sort(() => Math.random() - 0.5);
    return shuffled;
  });

  // Find new correct answer index after shuffling
  const newCorrectAnswer = shuffledOptions.findIndex(item => item.originalIndex === question.correctAnswer);

  const handleOptionSelect = (optionIndex: number) => {
    if (hasAnswered) return;
    setSelected(optionIndex);
  };

  const handleSubmit = () => {
    if (selected === null || hasAnswered) return;

    const correct = selected === newCorrectAnswer;
    const originalAnswerIndex = shuffledOptions[selected].originalIndex;
    setHasAnswered(true);
    onAnswer(question.id, originalAnswerIndex, correct, correct ? question.points : 0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'from-green-500 to-emerald-600';
      case 'Intermediate': return 'from-yellow-500 to-orange-600';
      case 'Advanced': return 'from-red-500 to-pink-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getOptionStyle = (optionIndex: number) => {
    if (!hasAnswered) {
      return selected === optionIndex
        ? 'border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg'
        : 'border-gray-200 hover:border-indigo-300 hover:shadow-md';
    }

    // Show results
    if (optionIndex === newCorrectAnswer) {
      return 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg';
    }

    if (selected === optionIndex && selected !== newCorrectAnswer) {
      return 'border-red-400 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg';
    }

    return 'border-gray-200 bg-gray-50';
  };

  const getOptionIcon = (optionIndex: number) => {
    if (!hasAnswered) {
      return selected === optionIndex ?
        <CheckCircle className="w-5 h-5 text-indigo-600" /> :
        <Circle className="w-5 h-5 text-gray-400" />;
    }

    if (optionIndex === newCorrectAnswer) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }

    if (selected === optionIndex && selected !== newCorrectAnswer) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }

    return <Circle className="w-5 h-5 text-gray-400" />;
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

      {/* Options */}
      <div className="space-y-3 mb-6">
        {shuffledOptions.map((item, index) => (
          <motion.button
            key={index}
            whileHover={!hasAnswered ? { scale: 1.02 } : {}}
            whileTap={!hasAnswered ? { scale: 0.98 } : {}}
            onClick={() => handleOptionSelect(index)}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left flex items-center gap-3 ${getOptionStyle(index)}`}
            disabled={hasAnswered}
          >
            {getOptionIcon(index)}
            <span className="text-gray-800 font-medium">{item.option}</span>
          </motion.button>
        ))}
      </div>

      {/* Submit Button */}
      {!hasAnswered && (
        <Button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-700 hover:via-purple-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answer
        </Button>
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