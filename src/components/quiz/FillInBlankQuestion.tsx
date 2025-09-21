'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FillInBlankQuestionProps {
  question: {
    id: string;
    text: string;
    blanks: {
      id: string;
      correctAnswers: string[]; // Multiple acceptable answers
      caseSensitive?: boolean;
    }[];
    explanation?: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    points: number;
  };
  onAnswer: (questionId: string, answers: string[], isCorrect: boolean, points: number) => void;
  showResult?: boolean;
  selectedAnswers?: string[];
  isCorrect?: boolean;
}

export function FillInBlankQuestion({ 
  question, 
  onAnswer, 
  showResult = false, 
  selectedAnswers = [],
  isCorrect 
}: FillInBlankQuestionProps) {
  const [answers, setAnswers] = useState<string[]>(
    selectedAnswers.length > 0 ? selectedAnswers : new Array(question.blanks.length).fill('')
  );
  const [hasAnswered, setHasAnswered] = useState(showResult);
  const [blankResults, setBlankResults] = useState<boolean[]>([]);

  const handleAnswerChange = (index: number, value: string) => {
    if (hasAnswered) return;
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const checkAnswer = (blankIndex: number, userAnswer: string): boolean => {
    const blank = question.blanks[blankIndex];
    const normalizedAnswer = blank.caseSensitive ? userAnswer : userAnswer.toLowerCase();
    
    return blank.correctAnswers.some(correctAnswer => {
      const normalizedCorrect = blank.caseSensitive ? correctAnswer : correctAnswer.toLowerCase();
      return normalizedAnswer.trim() === normalizedCorrect.trim();
    });
  };

  const handleSubmit = () => {
    if (hasAnswered) return;
    
    const results = answers.map((answer, index) => checkAnswer(index, answer));
    const allCorrect = results.every(result => result);
    
    setBlankResults(results);
    setHasAnswered(true);
    onAnswer(question.id, answers, allCorrect, allCorrect ? question.points : 0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'from-green-500 to-emerald-600';
      case 'Intermediate': return 'from-yellow-500 to-orange-600';
      case 'Advanced': return 'from-red-500 to-pink-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getInputStyle = (index: number) => {
    if (!hasAnswered) {
      return 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500';
    }

    return blankResults[index] 
      ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500'
      : 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500';
  };

  const getInputIcon = (index: number) => {
    if (!hasAnswered) return null;
    
    return blankResults[index] 
      ? <CheckCircle className="w-5 h-5 text-green-600" />
      : <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  // Parse question text to identify blanks (assuming blanks are marked with _____ or {blank})
  const renderQuestionWithBlanks = () => {
    let questionText = question.text;
    let blankIndex = 0;
    
    // Replace blanks with input fields (matches 3+ underscores or {blank})
    const parts = questionText.split(/(___+|\{blank\})/g);
    
    return parts.map((part, index) => {
      if (part.match(/^___+$/) || part === '{blank}') {
        const currentBlankIndex = blankIndex++;
        return (
          <span key={index} className="inline-flex items-center gap-2 mx-1">
            <div className="relative">
              <Input
                value={answers[currentBlankIndex] || ''}
                onChange={(e) => handleAnswerChange(currentBlankIndex, e.target.value)}
                className={`w-32 text-center font-medium ${getInputStyle(currentBlankIndex)}`}
                placeholder="Answer"
                disabled={hasAnswered}
              />
              {hasAnswered && (
                <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
                  {getInputIcon(currentBlankIndex)}
                </div>
              )}
            </div>
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
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

      {/* Question Text with Blanks */}
      <div className="mb-6">
        <div className="text-lg font-semibold text-gray-900 leading-relaxed">
          {renderQuestionWithBlanks()}
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          Fill in the blanks with the correct answers. Multiple correct answers may be accepted.
        </p>
      </div>

      {/* Submit Button */}
      {!hasAnswered && (
        <Button
          onClick={handleSubmit}
          disabled={answers.some(answer => !answer.trim())}
          className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-700 hover:via-purple-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answer
        </Button>
      )}

      {/* Results Summary */}
      {hasAnswered && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
        >
          <h4 className="font-semibold text-gray-900 mb-3">Correct Answers:</h4>
          <div className="space-y-2">
            {question.blanks.map((blank, index) => (
              <div key={blank.id} className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Blank {index + 1}:</span>
                <span className="font-medium text-gray-800">
                  {blank.correctAnswers.join(' or ')}
                </span>
                {blankResults[index] ? (
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