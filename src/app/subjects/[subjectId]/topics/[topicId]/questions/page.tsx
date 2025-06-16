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
  CheckCircle,
  Star,
  Zap,
  Award,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MultipleChoiceQuestion } from '@/components/quiz/MultipleChoiceQuestion';
import { TrueFalseQuestion } from '@/components/quiz/TrueFalseQuestion';
import { FillInBlankQuestion } from '@/components/quiz/FillInBlankQuestion';
import { NumericalQuestion } from '@/components/quiz/NumericalQuestion';
import { MatchingQuestion } from '@/components/quiz/MatchingQuestion';

// Mock data for different question types
const MOCK_QUESTIONS_DATA: Record<string, Record<string, {
  topicName: string;
  subjectName: string;
  questions: Array<{
    id: string;
    type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'numerical' | 'matching';
    data: any;
  }>;
  totalXP: number;
  estimatedTime: number;
}>> = {
  '1': { // Concrete Technology
    'ct-1': { // Fresh Concrete
      topicName: 'Fresh Concrete',
      subjectName: 'Concrete Technology',
      totalXP: 500,
      estimatedTime: 25,
      questions: [
        {
          id: 'mcq-1',
          type: 'multiple-choice',
          data: {
            id: 'mcq-1',
            text: 'What is the primary factor that affects the workability of fresh concrete?',
            options: [
              'Water-cement ratio',
              'Aggregate size',
              'Cement type',
              'Temperature'
            ],
            correctAnswer: 0,
            explanation: 'The water-cement ratio is the most critical factor affecting workability. Higher water content increases workability but reduces strength.',
            difficulty: 'Beginner',
            points: 50
          }
        },
        {
          id: 'tf-1',
          type: 'true-false',
          data: {
            id: 'tf-1',
            text: 'Adding more water to concrete mix always improves its workability without any negative effects.',
            correctAnswer: false,
            explanation: 'While adding water improves workability, it significantly reduces the concrete strength and durability due to increased porosity.',
            difficulty: 'Beginner',
            points: 40
          }
        },
        {
          id: 'fib-1',
          type: 'fill-in-blank',
          data: {
            id: 'fib-1',
            text: 'The _____ test is commonly used to measure the workability of fresh concrete, and a typical value for normal concrete is _____ mm.',
            blanks: [
              {
                id: 'blank-1',
                correctAnswers: ['slump', 'Slump'],
                caseSensitive: false
              },
              {
                id: 'blank-2',
                correctAnswers: ['75-100', '75', '100', '80', '90'],
                caseSensitive: false
              }
            ],
            explanation: 'The slump test measures concrete workability. Normal concrete typically has a slump of 75-100mm.',
            difficulty: 'Intermediate',
            points: 80
          }
        },
        {
          id: 'num-1',
          type: 'numerical',
          data: {
            id: 'num-1',
            text: 'Calculate the water-cement ratio for a concrete mix containing 350 kg/m³ of cement and 175 kg/m³ of water.',
            correctAnswer: 0.5,
            tolerance: 0.02,
            unit: '',
            formula: 'W/C ratio = Water content / Cement content',
            explanation: 'W/C ratio = 175/350 = 0.5. This is a typical ratio for normal strength concrete.',
            difficulty: 'Intermediate',
            points: 100
          }
        },
        {
          id: 'match-1',
          type: 'matching',
          data: {
            id: 'match-1',
            text: 'Match the concrete admixtures with their primary functions:',
            pairs: [
              {
                id: 'pair-1',
                left: 'Plasticizer',
                right: 'Improves workability without adding water'
              },
              {
                id: 'pair-2',
                left: 'Accelerator',
                right: 'Speeds up setting and hardening'
              },
              {
                id: 'pair-3',
                left: 'Retarder',
                right: 'Delays setting time'
              },
              {
                id: 'pair-4',
                left: 'Air-entraining agent',
                right: 'Introduces air bubbles for freeze-thaw resistance'
              }
            ],
            explanation: 'Different admixtures serve specific purposes in concrete mix design to achieve desired properties.',
            difficulty: 'Advanced',
            points: 120
          }
        },
        {
          id: 'mcq-2',
          type: 'multiple-choice',
          data: {
            id: 'mcq-2',
            text: 'Which factor does NOT directly affect the bleeding of fresh concrete?',
            options: [
              'Fineness of cement',
              'Water-cement ratio',
              'Aggregate gradation',
              'Curing temperature'
            ],
            correctAnswer: 3,
            explanation: 'Curing temperature affects hardened concrete properties but not bleeding, which occurs in fresh concrete.',
            difficulty: 'Advanced',
            points: 110
          }
        }
      ]
    }
  }
};

interface QuestionAnswer {
  questionId: string;
  answer: any;
  isCorrect: boolean;
  points: number;
}

export default function QuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [questionsData, setQuestionsData] = useState<typeof MOCK_QUESTIONS_DATA[string][string] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  const subjectId = params.subjectId as string;
  const topicId = params.topicId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && subjectId && topicId) {
      const mockData = MOCK_QUESTIONS_DATA[subjectId]?.[topicId];
      
      if (!mockData) {
        router.push(`/subjects/${subjectId}/topics/${topicId}`);
        return;
      }

      setQuestionsData(mockData);
      setIsLoading(false);
    }
  }, [status, subjectId, topicId, router]);

  const handleAnswer = (questionId: string, answer: any, isCorrect: boolean, points: number) => {
    const newAnswer: QuestionAnswer = {
      questionId,
      answer,
      isCorrect,
      points
    };

    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.questionId === questionId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newAnswer;
        return updated;
      }
      return [...prev, newAnswer];
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (questionsData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setQuizCompleted(false);
  };

  const renderQuestion = (question: NonNullable<typeof questionsData>['questions'][0]) => {
    const existingAnswer = answers.find(a => a.questionId === question.id);
    
    switch (question.type) {
      case 'multiple-choice':
        return (
          <MultipleChoiceQuestion
            key={question.id}
            question={question.data}
            onAnswer={handleAnswer}
            showResult={!!existingAnswer}
            selectedAnswer={existingAnswer?.answer}
            isCorrect={existingAnswer?.isCorrect}
          />
        );
      case 'true-false':
        return (
          <TrueFalseQuestion
            key={question.id}
            question={question.data}
            onAnswer={handleAnswer}
            showResult={!!existingAnswer}
            selectedAnswer={existingAnswer?.answer}
            isCorrect={existingAnswer?.isCorrect}
          />
        );
      case 'fill-in-blank':
        return (
          <FillInBlankQuestion
            key={question.id}
            question={question.data}
            onAnswer={handleAnswer}
            showResult={!!existingAnswer}
            selectedAnswers={existingAnswer?.answer}
            isCorrect={existingAnswer?.isCorrect}
          />
        );
      case 'numerical':
        return (
          <NumericalQuestion
            key={question.id}
            question={question.data}
            onAnswer={handleAnswer}
            showResult={!!existingAnswer}
            selectedAnswer={existingAnswer?.answer}
            isCorrect={existingAnswer?.isCorrect}
          />
        );
      case 'matching':
        return (
          <MatchingQuestion
            key={question.id}
            question={question.data}
            onAnswer={handleAnswer}
            showResult={!!existingAnswer}
            selectedMatches={existingAnswer?.answer}
            isCorrect={existingAnswer?.isCorrect}
          />
        );
      default:
        return null;
    }
  };

  const calculateResults = () => {
    const totalQuestions = questionsData?.questions.length || 0;
    const answeredQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalPoints = answers.reduce((sum, a) => sum + a.points, 0);
    const maxPoints = questionsData?.totalXP || 0;
    const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const timeSpent = Math.round((Date.now() - startTime) / 1000 / 60); // minutes

    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      totalPoints,
      maxPoints,
      percentage,
      timeSpent
    };
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!questionsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Questions not found</p>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const results = calculateResults();
    
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
              Back to {questionsData.topicName}
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
              <p className="text-gray-600">Great job on completing the {questionsData.topicName} questions</p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">{results.correctAnswers}</div>
                <div className="text-sm text-green-600">Correct</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{results.percentage.toFixed(0)}%</div>
                <div className="text-sm text-blue-600">Score</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-700">{results.totalPoints}</div>
                <div className="text-sm text-purple-600">XP Earned</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700">{results.timeSpent}</div>
                <div className="text-sm text-orange-600">Minutes</div>
              </div>
            </div>

            {/* Performance Badge */}
            <div className="mb-8">
              {results.percentage >= 90 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-semibold">
                  <Star className="w-5 h-5" />
                  Excellent Performance!
                </div>
              )}
              {results.percentage >= 70 && results.percentage < 90 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full font-semibold">
                  <Award className="w-5 h-5" />
                  Good Job!
                </div>
              )}
              {results.percentage < 70 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full font-semibold">
                  <Target className="w-5 h-5" />
                  Keep Practicing!
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleRestartQuiz}
                variant="outline"
                className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry Quiz
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

  const currentQuestion = questionsData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questionsData.questions.length) * 100;
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

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
            Back to {questionsData.topicName}
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{questionsData.topicName} Questions</h1>
              <p className="text-gray-600">{questionsData.subjectName}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questionsData.questions.length}</div>
              <div className="text-lg font-semibold text-indigo-600">{questionsData.totalXP} XP Available</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
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

        {/* Question */}
        <div className="mb-8">
          {renderQuestion(currentQuestion)}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="border-gray-300 hover:border-gray-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-gray-600">
            {answers.filter(a => a.isCorrect).length} correct out of {answers.length} answered
          </div>

          <Button
            onClick={handleNextQuestion}
            disabled={!currentAnswer}
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-700 hover:via-purple-700 hover:to-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQuestionIndex === questionsData.questions.length - 1 ? 'Finish Quiz' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
} 