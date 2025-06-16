'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NumericalQuestionProps {
  question: {
    id: string;
    text: string;
    correctAnswer: number;
    tolerance?: number; // Acceptable margin of error
    unit?: string;
    explanation?: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    points: number;
    formula?: string; // Optional formula hint
  };
  onAnswer: (questionId: string, answer: number, isCorrect: boolean, points: number) => void;
  showResult?: boolean;
  selectedAnswer?: number;
  isCorrect?: boolean;
}

export function NumericalQuestion({ 
  question, 
  onAnswer, 
  showResult = false, 
  selectedAnswer,
  isCorrect 
}: NumericalQuestionProps) {
  const [answer, setAnswer] = useState<string>(selectedAnswer?.toString() || '');
  const [hasAnswered, setHasAnswered] = useState(showResult);
  const [answerIsCorrect, setAnswerIsCorrect] = useState(isCorrect || false);

  const handleAnswerChange = (value: string) => {
    if (hasAnswered) return;
    // Allow numbers, decimal points, and negative signs
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      setAnswer(value);
    }
  };

  const checkAnswer = (userAnswer: number): boolean => {
    const tolerance = question.tolerance || 0.01; // Default 1% tolerance
    const difference = Math.abs(userAnswer - question.correctAnswer);
    const relativeTolerance = Math.abs(question.correctAnswer * tolerance);
    return difference <= Math.max(relativeTolerance, 0.001); // Minimum absolute tolerance
  };

  const handleSubmit = () => {
    if (hasAnswered || !answer.trim()) return;
    
    const numericAnswer = parseFloat(answer);
    if (isNaN(numericAnswer)) return;
    
    const correct = checkAnswer(numericAnswer);
    setAnswerIsCorrect(correct);
    setHasAnswered(true);
    onAnswer(question.id, numericAnswer, correct, correct ? question.points : 0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'from-green-500 to-emerald-600';
      case 'Intermediate': return 'from-yellow-500 to-orange-600';
      case 'Advanced': return 'from-red-500 to-pink-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getInputStyle = () => {
    if (!hasAnswered) {
      return 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500';
    }

    return answerIsCorrect 
      ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500'
      : 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500';
  };

  const formatNumber = (num: number): string => {
    // Format number with appropriate decimal places
    if (num % 1 === 0) return num.toString();
    return num.toFixed(3).replace(/\.?0+$/, '');
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
          <Calculator className="w-4 h-4" />
          <span className="font-medium">{question.points} XP</span>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
          {question.text}
        </h3>
      </div>

      {/* Formula Hint */}
      {question.formula && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">Formula Hint:</span>
          </div>
          <code className="text-purple-800 font-mono text-sm">{question.formula}</code>
        </div>
      )}

      {/* Answer Input */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              value={answer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className={`text-lg font-medium text-center ${getInputStyle()}`}
              placeholder="Enter your answer"
              disabled={hasAnswered}
            />
            {hasAnswered && (
              <div className="absolute -right-10 top-1/2 transform -translate-y-1/2">
                {answerIsCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
            )}
          </div>
          {question.unit && (
            <div className="px-3 py-2 bg-gray-100 rounded-lg border border-gray-300">
              <span className="text-gray-700 font-medium">{question.unit}</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          Enter your numerical answer. {question.tolerance && `Tolerance: ±${(question.tolerance * 100).toFixed(1)}%`}
        </p>
      </div>

      {/* Submit Button */}
      {!hasAnswered && (
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || isNaN(parseFloat(answer))}
          className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-700 hover:via-purple-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answer
        </Button>
      )}

      {/* Results */}
      {hasAnswered && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Correct Answer:</h4>
              <p className="text-lg font-mono text-gray-800">
                {formatNumber(question.correctAnswer)} {question.unit}
              </p>
            </div>
            <div className="text-right">
              <h4 className="font-semibold text-gray-900 mb-1">Your Answer:</h4>
              <p className="text-lg font-mono text-gray-800">
                {answer} {question.unit}
              </p>
            </div>
          </div>
          {!answerIsCorrect && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Difference: {Math.abs(parseFloat(answer) - question.correctAnswer).toFixed(3)} {question.unit}
              </p>
            </div>
          )}
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