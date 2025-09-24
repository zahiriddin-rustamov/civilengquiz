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
  ArrowRight,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MultipleChoiceQuestion } from '@/components/quiz/MultipleChoiceQuestion';
import { TrueFalseQuestion } from '@/components/quiz/TrueFalseQuestion';
import { FillInBlankQuestion } from '@/components/quiz/FillInBlankQuestion';
import { NumericalQuestion } from '@/components/quiz/NumericalQuestion';
import { MatchingQuestion } from '@/components/quiz/MatchingQuestion';
import { XPNotification } from '@/components/gamification';
import { useDashboard } from '@/context/DashboardProvider';

interface SectionQuestionsData {
  section: {
    id: string;
    name: string;
    description?: string;
    settings: {
      unlockConditions: 'always' | 'sequential' | 'score-based';
      requiredScore?: number;
      allowRandomAccess: boolean;
      showToStudents: 'always' | 'one-random' | 'sequential';
      requireCompletion: boolean;
    };
    progress: any;
  };
  topicName: string;
  subjectName: string;
  questions: Array<{
    id: string;
    type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'numerical' | 'matching';
    data: any;
  }>;
  totalXP: number;
  estimatedTime: number;
  hasAccess: boolean;
}

interface QuestionAnswer {
  questionId: string;
  answer: any;
  isCorrect: boolean;
  points: number;
}

export default function SectionQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { triggerRefresh } = useDashboard();

  const [questionsData, setQuestionsData] = useState<SectionQuestionsData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [xpNotification, setXpNotification] = useState<{
    xpGained: number;
    leveledUp: boolean;
    newLevel?: number;
    newAchievements: any[];
  } | null>(null);

  const subjectId = params.subjectId as string;
  const topicId = params.topicId as string;
  const sectionId = params.sectionId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && subjectId && topicId && sectionId) {
      fetchSectionQuestions();
    }
  }, [status, subjectId, topicId, sectionId, router]);

  const fetchSectionQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/sections/${sectionId}/questions`);
      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          setError(errorData.message || 'Section is locked');
          return;
        }
        if (response.status === 404) {
          router.push(`/subjects/${subjectId}/topics/${topicId}/sections`);
          return;
        }
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setQuestionsData(data);
    } catch (err) {
      console.error('Error fetching section questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (questionId: string, answer: any, isCorrect: boolean, points: number) => {
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

    // Update user progress in database
    try {
      const response = await fetch('/api/user/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: questionId,
          contentType: 'question',
          topicId: topicId,
          subjectId: subjectId,
          sectionId: sectionId,
          completed: true,
          score: isCorrect ? points : 0,
          timeSpent: Math.round((Date.now() - startTime) / 1000),
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Show XP notification if XP was gained
        if (result.xpEarned > 0 || result.leveledUp || result.newAchievements.length > 0) {
          setXpNotification({
            xpGained: result.xpEarned,
            leveledUp: result.leveledUp,
            newLevel: result.newLevel,
            newAchievements: result.newAchievements
          });

          triggerRefresh();
        }
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (questionsData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSectionComplete();
    }
  };

  const handleSectionComplete = async () => {
    if (!questionsData) return;

    // Calculate section results
    const totalQuestions = questionsData.questions.length;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const sectionScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Update section progress
    try {
      await fetch('/api/user/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: sectionId,
          contentType: 'section',
          topicId: topicId,
          subjectId: subjectId,
          sectionId: sectionId,
          completed: questionsData.section.settings.requireCompletion ?
            answers.length === totalQuestions : true,
          score: sectionScore,
          timeSpent: timeSpent,
          data: {
            questionsAnswered: answers.length,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers
          }
        }),
      });
    } catch (error) {
      console.error('Failed to update section progress:', error);
    }

    setQuizCompleted(true);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleRestartSection = () => {
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
          <p className="text-gray-600">Loading section questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">
            <Lock className="w-8 h-8 mx-auto mb-2" />
            Section Locked
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchSectionQuestions} variant="outline">
              Try Again
            </Button>
            <Button asChild>
              <Link href={`/subjects/${subjectId}/topics/${topicId}/sections`}>Back to Sections</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!questionsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Section not found</p>
          <Button asChild className="mt-4">
            <Link href={`/subjects/${subjectId}/topics/${topicId}/sections`}>Back to Sections</Link>
          </Button>
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
              href={`/subjects/${subjectId}/topics/${topicId}/sections`}
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sections
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Section Completed!</h1>
              <p className="text-gray-600">Great job on completing "{questionsData.section.name}"</p>
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
                onClick={handleRestartSection}
                variant="outline"
                className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry Section
              </Button>
              <Link href={`/subjects/${subjectId}/topics/${topicId}/sections`}>
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
      {/* XP Notification */}
      {xpNotification && (
        <XPNotification
          xpGained={xpNotification.xpGained}
          leveledUp={xpNotification.leveledUp}
          newLevel={xpNotification.newLevel}
          newAchievements={xpNotification.newAchievements}
          onComplete={() => setXpNotification(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/subjects/${subjectId}/topics/${topicId}/sections`}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sections
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{questionsData.section.name}</h1>
              <p className="text-gray-600">{questionsData.subjectName} → {questionsData.topicName}</p>
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
            <span className="text-sm font-medium text-gray-700">Section Progress</span>
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
            {currentQuestionIndex === questionsData.questions.length - 1 ? 'Finish Section' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}