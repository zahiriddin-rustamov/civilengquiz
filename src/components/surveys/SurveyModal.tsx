'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RatingQuestion } from './RatingQuestion';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import { TextQuestion } from './TextQuestion';
import { MessageSquare, CheckCircle } from 'lucide-react';

interface SurveyQuestion {
  id: string;
  type: 'rating' | 'multiple_choice' | 'text';
  question: string;
  required: boolean;
  options?: string[];
  scale?: { min: number; max: number; labels?: string[] };
}

interface Survey {
  _id: string;
  title: string;
  description?: string;
  triggerType: 'section_completion' | 'flashcard_completion' | 'media_completion';
  questions: SurveyQuestion[];
}

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: Survey | null;
  triggerContentId: string;
  onSubmitSuccess?: () => void;
}

interface SurveyResponse {
  questionId: string;
  answer: any;
}

export function SurveyModal({
  isOpen,
  onClose,
  survey,
  triggerContentId,
  onSubmitSuccess
}: SurveyModalProps) {
  console.log('SurveyModal rendered with props:', { isOpen, surveyTitle: survey?.title, triggerContentId });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (survey && isOpen) {
      // Initialize responses array
      setResponses(survey.questions.map(q => ({ questionId: q.id, answer: null })));
      setCurrentQuestionIndex(0);
      setError(null);
      setIsCompleted(false);
    }
  }, [survey, isOpen]);

  if (!survey) return null;

  const currentQuestion = survey.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;

  const handleAnswerChange = (questionId: string, answer: any) => {
    setResponses(prev => prev.map(r =>
      r.questionId === questionId ? { ...r, answer } : r
    ));
  };

  const getCurrentAnswer = (questionId: string) => {
    return responses.find(r => r.questionId === questionId)?.answer;
  };

  const isCurrentQuestionAnswered = () => {
    const currentAnswer = getCurrentAnswer(currentQuestion.id);
    if (currentQuestion.required) {
      return currentAnswer !== null && currentAnswer !== undefined && currentAnswer !== '';
    }
    return true; // Optional questions can be skipped
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate required questions
    for (const question of survey.questions) {
      if (question.required) {
        const response = responses.find(r => r.questionId === question.id);
        if (!response || response.answer === null || response.answer === undefined || response.answer === '') {
          setError(`Please answer the required question: "${question.question}"`);
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);

      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      const submitData = {
        surveyId: survey._id,
        triggerContentId,
        triggerType: survey.triggerType,
        responses: responses.filter(r => r.answer !== null && r.answer !== undefined && r.answer !== ''),
        timeSpent
      };

      const response = await fetch('/api/surveys/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit survey');
      }

      setIsCompleted(true);

      // Close after a short delay to show success message
      setTimeout(() => {
        onClose();
        onSubmitSuccess?.();
      }, 2000);

    } catch (err) {
      console.error('Error submitting survey:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    const currentAnswer = getCurrentAnswer(currentQuestion.id);

    switch (currentQuestion.type) {
      case 'rating':
        return (
          <RatingQuestion
            question={currentQuestion}
            value={currentAnswer}
            onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
          />
        );
      case 'multiple_choice':
        return (
          <MultipleChoiceQuestion
            question={currentQuestion}
            value={currentAnswer}
            onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
          />
        );
      case 'text':
        return (
          <TextQuestion
            question={currentQuestion}
            value={currentAnswer || ''}
            onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
          />
        );
      default:
        return null;
    }
  };

  console.log('Rendering Dialog with isOpen:', isOpen);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        {isCompleted ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
            <DialogTitle className="text-xl font-semibold text-gray-900 mb-2">
              Thank you for your feedback!
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Your responses have been submitted successfully.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <DialogTitle className="text-lg font-semibold">
                  {survey.title}
                </DialogTitle>
              </div>
              {survey.description && (
                <DialogDescription className="text-sm text-gray-600">
                  {survey.description}
                </DialogDescription>
              )}

              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Question {currentQuestionIndex + 1} of {survey.questions.length}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </DialogHeader>

            <div className="py-6">
              {renderQuestion()}
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50 mb-4">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                >
                  Skip Survey
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={currentQuestion.required && !isCurrentQuestionAnswered() || isSubmitting}
                >
                  {isSubmitting
                    ? 'Submitting...'
                    : isLastQuestion
                      ? 'Submit Survey'
                      : 'Next'
                  }
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}