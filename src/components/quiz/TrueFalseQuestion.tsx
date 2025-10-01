'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrueFalseQuestionProps {
  question: {
    id: string;
    text: string;
    correctAnswer: boolean;
    explanation?: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    points: number;
  };
  onAnswer: (questionId: string, selectedAnswer: boolean, isCorrect: boolean, points: number) => void;
  showResult?: boolean;
  selectedAnswer?: boolean;
  isCorrect?: boolean;
  hideMetadata?: boolean;
}

export function TrueFalseQuestion({
  question,
  onAnswer,
  showResult = false,
  selectedAnswer,
  isCorrect,
  hideMetadata = false
}: TrueFalseQuestionProps) {
  const [selected, setSelected] = useState<boolean | null>(selectedAnswer ?? null);
  const [hasAnswered, setHasAnswered] = useState(showResult);

  const handleOptionSelect = (value: boolean) => {
    if (hasAnswered) return;
    setSelected(value);
  };

  const handleSubmit = () => {
    if (selected === null || hasAnswered) return;
    
    const correct = selected === question.correctAnswer;
    setHasAnswered(true);
    onAnswer(question.id, selected, correct, correct ? question.points : 0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'from-green-500 to-emerald-600';
      case 'Intermediate': return 'from-yellow-500 to-orange-600';
      case 'Advanced': return 'from-red-500 to-pink-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getOptionStyle = (value: boolean) => {
    if (!hasAnswered) {
      return selected === value 
        ? 'border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg'
        : 'border-gray-200 hover:border-indigo-300 hover:shadow-md';
    }

    // Show results
    if (value === question.correctAnswer) {
      return 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg';
    }
    
    if (selected === value && selected !== question.correctAnswer) {
      return 'border-red-400 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg';
    }

    return 'border-gray-200 bg-gray-50';
  };

  const getOptionIcon = (value: boolean) => {
    const baseIcon = value ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />;
    
    if (!hasAnswered) {
      return (
        <div className={`p-2 rounded-full ${selected === value ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
          {baseIcon}
        </div>
      );
    }

    if (value === question.correctAnswer) {
      return (
        <div className="p-2 rounded-full bg-green-100 text-green-600">
          {baseIcon}
        </div>
      );
    }
    
    if (selected === value && selected !== question.correctAnswer) {
      return (
        <div className="p-2 rounded-full bg-red-100 text-red-600">
          <AlertCircle className="w-6 h-6" />
        </div>
      );
    }

    return (
      <div className="p-2 rounded-full bg-gray-100 text-gray-400">
        {baseIcon}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
    >
      {/* Question Header */}
      {!hideMetadata && (
        <div className="flex items-center justify-between mb-6">
          <div className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{question.points} XP</span>
          </div>
        </div>
      )}

      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
          {question.text}
        </h3>
      </div>

      {/* True/False Options */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* True Option */}
        <motion.button
          whileHover={!hasAnswered ? { scale: 1.02 } : {}}
          whileTap={!hasAnswered ? { scale: 0.98 } : {}}
          onClick={() => handleOptionSelect(true)}
          className={`p-6 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-3 ${getOptionStyle(true)}`}
          disabled={hasAnswered}
        >
          {getOptionIcon(true)}
          <span className="text-lg font-semibold text-gray-800">True</span>
        </motion.button>

        {/* False Option */}
        <motion.button
          whileHover={!hasAnswered ? { scale: 1.02 } : {}}
          whileTap={!hasAnswered ? { scale: 0.98 } : {}}
          onClick={() => handleOptionSelect(false)}
          className={`p-6 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-3 ${getOptionStyle(false)}`}
          disabled={hasAnswered}
        >
          {getOptionIcon(false)}
          <span className="text-lg font-semibold text-gray-800">False</span>
        </motion.button>
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