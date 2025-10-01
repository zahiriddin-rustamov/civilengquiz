'use client';

import { useEffect, useState, useRef } from 'react';
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
  RotateCcw,
  Timer,
  AlertTriangle
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

interface QuizPlayerProps {
  mode: 'random' | 'timed';
  timePerQuestion?: number; // seconds per question (for timed mode)
  totalTimeLimit?: number; // total time limit in seconds
  questionCount?: number;
}

export function QuizPlayer({
  mode,
  timePerQuestion = 10,
  totalTimeLimit,
  questionCount = 10
}: QuizPlayerProps) {
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

  // Timer states
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [totalTimeLeft, setTotalTimeLeft] = useState(totalTimeLimit || 0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchQuiz();
    }
  }, [status, router]);

  // Timer effects
  useEffect(() => {
    if (mode === 'timed' && quizData && !quizCompleted && !isLoading) {
      setIsTimerActive(true);
      setTimeLeft(timePerQuestion);
    }
  }, [currentQuestionIndex, quizData, mode, timePerQuestion, quizCompleted, isLoading]);

  useEffect(() => {
    if (mode === 'timed' && isTimerActive && timeLeft > 0 && !quizCompleted) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (mode === 'timed' && timeLeft === 0 && !quizCompleted) {
      // Time's up for this question - auto advance or complete quiz
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isTimerActive, mode, quizCompleted]);

  // Total timer effect
  useEffect(() => {
    if (mode === 'timed' && totalTimeLimit && isTimerActive && totalTimeLeft > 0 && !quizCompleted) {
      totalTimerRef.current = setTimeout(() => {
        setTotalTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (mode === 'timed' && totalTimeLimit && totalTimeLeft === 0 && !quizCompleted) {
      // Total time's up - complete quiz
      handleQuizComplete();
    }

    return () => {
      if (totalTimerRef.current) {
        clearTimeout(totalTimerRef.current);
      }
    };
  }, [totalTimeLeft, isTimerActive, mode, totalTimeLimit, quizCompleted]);

  const handleTimeUp = () => {
    const currentQuestion = quizData?.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    // If no answer given, record as incorrect
    if (!answers.has(currentQuestion.id)) {
      const newAnswers = new Map(answers);
      newAnswers.set(currentQuestion.id, { answer: null, isCorrect: false, points: 0 });
      setAnswers(newAnswers);
    }

    // Move to next question or complete quiz
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleQuizComplete();
    }
  };

  const fetchQuiz = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setAnswers(new Map());
      setCurrentQuestionIndex(0);
      setQuizCompleted(false);

      const params = new URLSearchParams({
        count: questionCount.toString(),
        mode: mode
      });

      const response = await fetch(`/api/quiz/random?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }

      const data = await response.json();
      setQuizData(data.quiz);

      // Initialize total timer if specified
      if (totalTimeLimit) {
        setTotalTimeLeft(totalTimeLimit);
      }
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: any, isCorrect: boolean, points: number) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, { answer, isCorrect, points });
    setAnswers(newAnswers);

    // For timed mode, auto advance after answer
    if (mode === 'timed') {
      setTimeout(() => {
        handleNextQuestion();
      }, 1500); // Short delay to show result
    }
  };

  const handleNextQuestion = () => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleQuizComplete();
    }
  };

  const handlePreviousQuestion = () => {
    // Don't allow going back in timed mode
    if (mode === 'timed') return;

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuizComplete = async () => {
    if (!quizData) return;

    setIsTimerActive(false);

    const totalQuestions = quizData.questions.length;
    const correctAnswers = Array.from(answers.values()).filter(a => a.isCorrect).length;
    const score = (correctAnswers / totalQuestions) * 100;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Award XP based on mode
    const endpoint = mode === 'timed' ? '/api/user/progress/timed-quiz-complete' : '/api/user/progress/random-quiz-complete';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          correctAnswers,
          totalQuestions,
          timeSpent,
          mode
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
      console.error('Failed to save quiz completion:', error);
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
        return (
          <FillInBlankQuestion
            key={question.id}
            question={{
              id: question.id,
              text: question.questionText,
              blanks: question.options?.blanks || [],
              difficulty: question.difficulty,
              points: question.points,
              explanation: question.explanation
            }}
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (seconds: number) => {
    if (seconds > timePerQuestion * 0.5) return 'text-green-600';
    if (seconds > timePerQuestion * 0.25) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          {mode === 'timed' ? (
            <Timer className="w-16 h-16 text-indigo-600 animate-pulse mx-auto mb-4" />
          ) : (
            <Shuffle className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          )}
          <p className="text-indigo-600 font-medium">
            {mode === 'timed' ? 'Preparing timed quiz...' : 'Generating random quiz...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchQuiz()}>Try Again</Button>
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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {mode === 'timed' ? 'Timed Quiz Complete!' : 'Quiz Complete!'}
              </h1>
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
                  onClick={() => fetchQuiz()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {mode === 'timed' ? (
                    <>
                      <Timer className="w-4 h-4 mr-2" />
                      New Timed Quiz
                    </>
                  ) : (
                    <>
                      <Shuffle className="w-4 h-4 mr-2" />
                      New Random Quiz
                    </>
                  )}
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
              {mode === 'timed' ? 'Timed Quiz' : 'Random Quiz'} • {quizData.totalQuestions} Questions
            </span>
            {mode === 'timed' && (
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-indigo-600" />
                <span className={`text-sm font-mono font-bold ${getTimerColor(timeLeft)}`}>
                  {formatTime(timeLeft)}
                </span>
                {totalTimeLimit && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm font-mono text-gray-600">
                      Total: {formatTime(totalTimeLeft)}
                    </span>
                  </>
                )}
              </div>
            )}
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
              className={`h-full transition-all duration-300 ${
                mode === 'timed'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600'
              }`}
              style={{ width: `${((currentQuestionIndex + 1) / quizData.totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Timer Warning */}
        {mode === 'timed' && timeLeft <= 5 && timeLeft > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center justify-center space-x-2"
          >
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-600 font-medium">
              Time running out! {timeLeft} seconds left
            </span>
          </motion.div>
        )}

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
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentQuestion.difficulty === 'Advanced' ? 'bg-red-100 text-red-600' :
                  currentQuestion.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {currentQuestion.difficulty}
                </span>
                {mode === 'timed' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                    Timed
                  </span>
                )}
              </div>
            </div>
          </div>

          {renderQuestion(currentQuestion)}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0 || mode === 'timed'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <span className="text-sm text-gray-500">
              {currentQuestion.points} points
            </span>

            {mode !== 'timed' && (
              <Button
                onClick={handleNextQuestion}
                disabled={!currentAnswer}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {currentQuestionIndex === quizData.questions.length - 1 ? 'Finish' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {mode === 'timed' && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Auto-advancing...</div>
                <div className={`text-lg font-mono font-bold ${getTimerColor(timeLeft)}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}