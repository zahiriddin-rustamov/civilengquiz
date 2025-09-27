'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RatingQuestion } from './RatingQuestion';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import { TextQuestion } from './TextQuestion';
import { MessageSquare, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

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
  triggerType: string;
  questions: SurveyQuestion[];
}

interface SurveyFormProps {
  survey: Survey;
  triggerContentId: string;
  onSubmitSuccess: () => void;
  className?: string;
}

interface SurveyResponse {
  questionId: string;
  answer: any;
}

export function SurveyForm({
  survey,
  triggerContentId,
  onSubmitSuccess,
  className = ""
}: SurveyFormProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (survey) {
      // Initialize responses array
      setResponses(survey.questions.map(q => ({ questionId: q.id, answer: null })));
      setCurrentQuestionIndex(0);
      setError(null);
      setIsCompleted(false);
    }
  }, [survey]);

  const handleAnswer = (questionId: string, answer: any) => {
    setResponses(prev =>
      prev.map(r =>
        r.questionId === questionId ? { ...r, answer } : r
      )
    );
  };

  const handleNext = () => {
    if (currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const isCurrentQuestionAnswered = () => {
    const currentQuestion = survey.questions[currentQuestionIndex];
    const currentResponse = responses.find(r => r.questionId === currentQuestion.id);

    if (!currentQuestion.required) return true;

    return currentResponse?.answer !== null && currentResponse?.answer !== undefined && currentResponse?.answer !== '';
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      const response = await fetch('/api/surveys/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyId: survey._id,
          triggerContentId,
          triggerType: survey.triggerType,
          responses: responses.filter(r => r.answer !== null),
          timeSpent
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit survey');
      }

      setIsCompleted(true);

      // Call success callback after a short delay to show completion message
      setTimeout(() => {
        onSubmitSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error submitting survey:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const currentResponse = responses.find(r => r.questionId === question.id);

    switch (question.type) {
      case 'rating':
        return (
          <RatingQuestion
            question={question}
            value={currentResponse?.answer || 0}
            onChange={(value) => handleAnswer(question.id, value)}
          />
        );
      case 'multiple_choice':
        return (
          <MultipleChoiceQuestion
            question={question}
            selectedOption={currentResponse?.answer || ''}
            onChange={(value) => handleAnswer(question.id, value)}
          />
        );
      case 'text':
        return (
          <TextQuestion
            question={question}
            value={currentResponse?.answer || ''}
            onChange={(value) => handleAnswer(question.id, value)}
          />
        );
      default:
        return null;
    }
  };

  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  const currentQuestion = survey.questions[currentQuestionIndex];

  if (isCompleted) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="text-center py-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
          <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
            Thank you for your feedback!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your responses have been submitted successfully.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold">
            {survey.title}
          </CardTitle>
        </div>
        {survey.description && (
          <CardDescription className="text-sm text-gray-600">
            {survey.description}
          </CardDescription>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {survey.questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Question */}
        <div className="space-y-4">
          {renderQuestion(currentQuestion)}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={!isCurrentQuestionAnswered() || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : currentQuestionIndex === survey.questions.length - 1 ? (
              'Submit Survey'
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}