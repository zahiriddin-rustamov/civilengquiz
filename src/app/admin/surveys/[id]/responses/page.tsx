'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Download } from 'lucide-react';
import { SurveyResponseDashboard } from '@/components/surveys/SurveyResponseDashboard';
import { Types } from 'mongoose';

interface Survey {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  triggerType: 'section_completion' | 'flashcard_completion' | 'media_completion';
  questions: {
    id: string;
    type: 'rating' | 'multiple_choice' | 'text';
    question: string;
    required: boolean;
    options?: string[];
    scale?: { min: number; max: number; labels?: string[] };
  }[];
}

interface SurveyResponse {
  _id: Types.ObjectId;
  surveyId: {
    _id: string;
    title: string;
    triggerType: string;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  triggerContentId: Types.ObjectId;
  triggerType: string;
  responses: {
    questionId: string;
    answer: any;
  }[];
  completedAt: Date;
  timeSpent: number;
  contentInfo?: {
    type: string;
    name: string;
    topicName?: string;
    subjectName?: string;
    path: string;
  };
}

const triggerTypeLabels = {
  section_completion: 'Section Completion',
  flashcard_completion: 'Flashcard Completion',
  media_completion: 'Media Completion'
};

export default function SurveyResponsesPage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (surveyId) {
      fetchSurveyAndResponses();
    }
  }, [surveyId]);





  const fetchSurveyAndResponses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch survey details
      const surveyResponse = await fetch(`/api/surveys/${surveyId}`);
      if (!surveyResponse.ok) {
        throw new Error('Failed to fetch survey');
      }
      const surveyData = await surveyResponse.json();
      setSurvey(surveyData);

      // Fetch responses
      const responsesResponse = await fetch(`/api/surveys/responses?surveyId=${surveyId}`);
      if (!responsesResponse.ok) {
        throw new Error('Failed to fetch responses');
      }
      const responsesData = await responsesResponse.json();
      setResponses(responsesData);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };


  const exportResponses = () => {
    if (!survey || responses.length === 0) return;

    const csvContent = [
      // Header
      ['Response ID', 'User Name', 'User Email', 'Content', 'Content Path', 'Completed At', 'Time Spent (seconds)',
       ...survey.questions.map(q => q.question)].join(','),
      // Rows
      ...responses.map(response => [
        response._id.toString(),
        response.userId.name,
        response.userId.email,
        response.contentInfo?.name || 'Unknown',
        response.contentInfo?.path || 'Unknown',
        new Date(response.completedAt).toISOString(),
        response.timeSpent,
        ...survey.questions.map(q => {
          const answer = response.responses.find(r => r.questionId === q.id);
          return answer ? JSON.stringify(answer.answer) : '';
        })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-${survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-responses.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Survey Responses</h1>
            <p className="text-gray-600">Loading survey responses...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Survey Responses</h1>
            <p className="text-gray-600">Error loading survey responses</p>
          </div>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={fetchSurveyAndResponses} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Survey Responses</h1>
            <p className="text-gray-600">Survey not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/surveys">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Surveys
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{survey.title} - Responses</h1>
          <div className="flex items-center space-x-2 mt-1">
            <Badge className="bg-blue-100 text-blue-800" variant="outline">
              {triggerTypeLabels[survey.triggerType] || survey.triggerType}
            </Badge>
            <span className="text-gray-600">•</span>
            <span className="text-gray-600">{survey.questions.length} questions</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-600">{responses.length} total responses</span>
          </div>
        </div>
      </div>

      {/* Enhanced Survey Response Dashboard */}
      <SurveyResponseDashboard
        survey={survey}
        responses={responses}
        onExportResponses={exportResponses}
      />
    </div>
  );
}