'use client';

import { useParams } from 'next/navigation';
import { QuizPlayer } from '@/components/quiz/QuizPlayer';

export default function QuizModePage() {
  const params = useParams();
  const mode = params.mode as 'random' | 'timed';

  // Validate mode
  if (mode !== 'random' && mode !== 'timed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Quiz Mode</h1>
          <p className="text-gray-600 mb-4">
            The quiz mode "{mode}" is not supported.
          </p>
          <p className="text-sm text-gray-500">
            Available modes: random, timed
          </p>
        </div>
      </div>
    );
  }

  // Configure quiz settings based on mode
  const quizSettings = {
    random: {
      mode: 'random' as const,
      questionCount: 10,
    },
    timed: {
      mode: 'timed' as const,
      timePerQuestion: 10, // 10 seconds per question
      questionCount: 10,
      // totalTimeLimit: 150, // Optional: 2.5 minutes total (for 10 questions)
    }
  };

  const settings = quizSettings[mode];

  return <QuizPlayer {...settings} />;
}