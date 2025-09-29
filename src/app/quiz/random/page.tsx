'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Shuffle,
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { MultipleChoiceQuestion } from '@/components/quiz/MultipleChoiceQuestion';
import { TrueFalseQuestion } from '@/components/quiz/TrueFalseQuestion';
import { FillInBlankQuestion } from '@/components/quiz/FillInBlankQuestion';
import { NumericalQuestion } from '@/components/quiz/NumericalQuestion';
import { MatchingQuestion } from '@/components/quiz/MatchingQuestion';
import { XPNotification } from '@/components/gamification';
import { useDashboard } from '@/context/DashboardProvider';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'numerical' | 'matching';
  questionText: string;
  options?: any;
  correctAnswer: any;
  difficulty: string;
  points: number;
  topicName: string;
  subjectName: string;
  userPerformance?: {
    score: number;
    attempts: number;
    completed: boolean;
  };
}

interface QuizData {
  questions: QuizQuestion[];
  totalQuestions: number;
  totalPoints: number;
  estimatedTime: number;
  difficulty: string;
  type: string;
}

export default function RandomQuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { triggerRefresh } = useDashboard();

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, { answer: any; isCorrect: boolean; points: number }>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [xpNotification, setXpNotification] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchRandomQuiz();
    }
  }, [status, router]);

  const fetchRandomQuiz = async (count: number = 10) => {
    try {
      setIsLoading(true);
      setError(null);
      setAnswers(new Map());
      setCurrentQuestionIndex(0);
      setQuizCompleted(false);

      const response = await fetch(`/api/quiz/random?count=${count}`);
      if (!response.ok) {
        throw new Error('Failed to fetch random quiz');
      }

      const data = await response.json();
      setQuizData(data.quiz);
    } catch (err) {
      console.error('Error fetching random quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: any, isCorrect: boolean, points: number) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, { answer, isCorrect, points });
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleQuizComplete();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuizComplete = async () => {
    if (!quizData) return;

    const totalQuestions = quizData.questions.length;
    const correctAnswers = Array.from(answers.values()).filter(a => a.isCorrect).length;
    const score = (correctAnswers / totalQuestions) * 100;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Award 5 XP for completing the random quiz (once per day)
    try {
      const response = await fetch('/api/user/progress/random-quiz-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          correctAnswers,
          totalQuestions,
          timeSpent
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.xpAwarded) {
          setXpNotification({
            xpGained: result.xpGained,
            leveledUp: result.leveledUp,
            newLevel: result.newLevel,
            newAchievements: result.newAchievements || []
          });
        }
      }
    } catch (error) {
      console.error('Failed to save random quiz completion:', error);
    }

    setQuizCompleted(true);
    triggerRefresh();
  };

  const renderQuestion = (question: QuizQuestion) => {
    if (!question) return null;

    const existingAnswer = answers.get(question.id);
    const questionData = {
      id: question.id,
      text: question.questionText,
      options: question.options || [],
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      points: question.points
    };

    switch (question.type) {
      case 'multiple-choice':
        return (
          <MultipleChoiceQuestion
            key={question.id}
            question={questionData}
            onAnswer={handleAnswer}
            showResult={!!existingAnswer}
            selectedAnswer={existingAnswer?.answer}
            isCorrect={existingAnswer?.isCorrect}
          />
        );
      case 'true-false':
        // TrueFalseQuestion expects text and boolean correctAnswer
        return (
          <TrueFalseQuestion
            key={question.id}
            question={{
              ...questionData,
              correctAnswer: question.correctAnswer === 'true' || question.correctAnswer === true
            }}
            onAnswer={handleAnswer}
            showResult={!!existingAnswer}
            selectedAnswer={existingAnswer?.answer}
            isCorrect={existingAnswer?.isCorrect}
          />
        );
      case 'fill-in-blank':
        // FillInBlankQuestion may have different structure
        return (
          <FillInBlankQuestion
            key={question.id}
            question={{
              id: question.id,
              text: question.questionText,
              blanks: question.options?.blanks || [],
              correctAnswers: question.correctAnswer || [],
              difficulty: question.difficulty,
              points: question.points
            }}
            onAnswer={handleAnswer}
            showResult={!!existingAnswer}
            selectedAnswers={existingAnswer?.answer}
            isCorrect={existingAnswer?.isCorrect}
          />
        );
      case 'numerical':
        // NumericalQuestion expects numeric answer
        return (
          <NumericalQuestion
            key={question.id}
            question={{
              id: question.id,
              text: question.questionText,
              correctAnswer: question.correctAnswer,
              tolerance: question.options?.tolerance || 0.01,
              unit: question.options?.unit,
              difficulty: question.difficulty,
              points: question.points
            }}
            onAnswer={handleAnswer}
            showResult={!!existingAnswer}
            selectedAnswer={existingAnswer?.answer}
            isCorrect={existingAnswer?.isCorrect}
          />
        );
      case 'matching':
        // MatchingQuestion has pairs structure
        return (
          <MatchingQuestion
            key={question.id}
            question={{
              id: question.id,
              text: question.questionText,
              pairs: question.options?.pairs || [],
              difficulty: question.difficulty,
              points: question.points
            }}
            onAnswer={handleAnswer}
            showResult={!!existingAnswer}
            selectedMatches={existingAnswer?.answer}
            isCorrect={existingAnswer?.isCorrect}
          />
        );
      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <Shuffle className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-indigo-600 font-medium">Generating random quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchRandomQuiz()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (quizCompleted && quizData) {
    const totalQuestions = quizData.questions.length;
    const correctAnswers = Array.from(answers.values()).filter(a => a.isCorrect).length;
    const score = (correctAnswers / totalQuestions) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h1>
              <p className="text-xl text-gray-600 mb-6">
                You scored {correctAnswers} out of {totalQuestions}
              </p>

              <div className="flex justify-center space-x-4 mb-8">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <Target className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-indigo-600">{score.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((Date.now() - startTime) / 1000)}s
                  </div>
                  <div className="text-sm text-gray-600">Time</div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => fetchRandomQuiz()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  New Random Quiz
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {xpNotification && (
          <XPNotification
            xpGained={xpNotification.xpGained}
            leveledUp={xpNotification.leveledUp}
            newLevel={xpNotification.newLevel}
            newAchievements={xpNotification.newAchievements}
            onClose={() => setXpNotification(null)}
          />
        )}
      </div>
    );
  }

  if (!quizData || quizData.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No questions available</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Random Quiz • {quizData.totalQuestions} Questions
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {quizData.totalQuestions}
            </span>
            <span className="text-sm text-gray-500">
              {Array.from(answers.values()).filter(a => a.isCorrect).length} correct so far
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quizData.totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-6"
        >
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                {currentQuestion.subjectName} • {currentQuestion.topicName}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentQuestion.difficulty === 'Advanced' ? 'bg-red-100 text-red-600' :
                currentQuestion.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600' :
                'bg-green-100 text-green-600'
              }`}>
                {currentQuestion.difficulty}
              </span>
            </div>
          </div>

          {renderQuestion(currentQuestion)}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <span className="text-sm text-gray-500">
              {currentQuestion.points} points
            </span>

            <Button
              onClick={handleNextQuestion}
              disabled={!currentAnswer}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {currentQuestionIndex === quizData.questions.length - 1 ? 'Finish' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}