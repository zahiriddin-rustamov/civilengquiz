'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Star,
  CheckCircle,
  MessageSquare,
  Loader2
} from 'lucide-react';

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
  description: string;
  triggerType: 'section_completion' | 'flashcard_completion' | 'media_completion';
  targeting: {
    type: 'all' | 'specific_sections' | 'specific_topics' | 'specific_subjects';
    sectionIds: string[];
    topicIds: string[];
    subjectIds: string[];
  };
  questions: SurveyQuestion[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const questionTypes = {
  'rating': { label: 'Rating Scale', icon: Star },
  'multiple_choice': { label: 'Multiple Choice', icon: CheckCircle },
  'text': { label: 'Text Response', icon: MessageSquare }
};

const triggerTypes = {
  'section_completion': 'Section Completion',
  'flashcard_completion': 'Flashcard Completion',
  'media_completion': 'Media Completion'
};

const targetingTypes = {
  'all': 'All Content',
  'specific_sections': 'Specific Sections',
  'specific_topics': 'Specific Topics',
  'specific_subjects': 'Specific Subjects'
};

export default function ViewSurveyPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data for displaying targeting info
  const [subjects, setSubjects] = useState<Array<{_id: string; name: string}>>([]);
  const [topics, setTopics] = useState<Array<{_id: string; name: string; subjectId: string}>>([]);
  const [sections, setSections] = useState<Array<{_id: string; name: string; topicId: string}>>([]);

  // Fetch survey data
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/surveys/${surveyId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch survey');
        }

        const surveyData = await response.json();
        setSurvey(surveyData);
      } catch (err) {
        console.error('Error fetching survey:', err);
        setError(err instanceof Error ? err.message : 'Failed to load survey');
      } finally {
        setIsLoading(false);
      }
    };

    if (surveyId) {
      fetchSurvey();
    }
  }, [surveyId]);

  // Fetch targeting data to display names
  useEffect(() => {
    const fetchTargetingData = async () => {
      try {
        // Fetch subjects
        const subjectsResponse = await fetch('/api/subjects?includeEmpty=true');
        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json();
          setSubjects(subjectsData);
        }

        // Fetch topics
        const topicsResponse = await fetch('/api/topics');
        if (topicsResponse.ok) {
          const topicsData = await topicsResponse.json();
          setTopics(topicsData);
        }

        // Fetch sections
        const sectionsResponse = await fetch('/api/sections');
        if (sectionsResponse.ok) {
          const sectionsData = await sectionsResponse.json();
          setSections(sectionsData);
        }
      } catch (error) {
        console.error('Error fetching targeting data:', error);
      }
    };

    fetchTargetingData();
  }, []);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete survey');
      }

      // Redirect to surveys list with success message
      router.push('/admin/surveys?deleted=true');
    } catch (err) {
      console.error('Error deleting survey:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete survey');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get targeted item names
  const getTargetedItems = () => {
    if (!survey) return [];

    if (survey.targeting.type === 'specific_sections') {
      return sections
        .filter(s => survey.targeting.sectionIds.includes(s._id))
        .map(s => s.name);
    } else if (survey.targeting.type === 'specific_topics') {
      return topics
        .filter(t => survey.targeting.topicIds.includes(t._id))
        .map(t => t.name);
    } else if (survey.targeting.type === 'specific_subjects') {
      return subjects
        .filter(s => survey.targeting.subjectIds.includes(s._id))
        .map(s => s.name);
    }

    return [];
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !survey) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/surveys">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Surveys
            </Link>
          </Button>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error || 'Survey not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/surveys">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Surveys
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{survey.title}</h1>
              <Badge variant={survey.isActive ? "default" : "secondary"}>
                {survey.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {survey.description && (
              <p className="text-gray-600 mt-1">{survey.description}</p>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/surveys/${surveyId}/responses`}>
              <FileText className="w-4 h-4 mr-2" />
              View Responses
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/surveys/${surveyId}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Information</CardTitle>
          <CardDescription>
            Basic details about this survey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Trigger Type</p>
              <p className="text-base text-gray-900 mt-1">
                {triggerTypes[survey.triggerType]}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-base text-gray-900 mt-1">
                {survey.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-base text-gray-900 mt-1">
                {new Date(survey.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-base text-gray-900 mt-1">
                {new Date(survey.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Targeting Information */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Targeting</CardTitle>
          <CardDescription>
            Which content this survey targets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Targeting Type</p>
            <p className="text-base text-gray-900 mt-1">
              {targetingTypes[survey.targeting.type]}
            </p>
          </div>

          {survey.targeting.type !== 'all' && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Targeted Items</p>
              <div className="flex flex-wrap gap-2">
                {getTargetedItems().length > 0 ? (
                  getTargetedItems().map((name, index) => (
                    <Badge key={index} variant="outline">
                      {name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No items selected</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Questions</CardTitle>
          <CardDescription>
            Questions shown to users ({survey.questions.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {survey.questions.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No questions</h3>
              <p className="mt-1 text-sm text-gray-500">
                This survey has no questions configured
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {survey.questions.map((question, index) => {
                const questionType = questionTypes[question.type];
                const IconComponent = questionType.icon;

                return (
                  <div key={question.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">
                              Question {index + 1}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {questionType.label}
                            </Badge>
                            {question.required && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-base text-gray-900 mt-1 font-medium">
                            {question.question}
                          </p>
                        </div>
                      </div>
                    </div>

                    {question.type === 'multiple_choice' && question.options && (
                      <div className="ml-7 space-y-1">
                        <p className="text-sm font-medium text-gray-500">Options:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {question.options.map((option, optionIndex) => (
                            <li key={optionIndex} className="text-sm text-gray-700">
                              {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {question.type === 'rating' && question.scale && (
                      <div className="ml-7">
                        <p className="text-sm font-medium text-gray-500">
                          Rating Scale: {question.scale.min} to {question.scale.max}
                        </p>
                        {question.scale.labels && question.scale.labels.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            Labels: {question.scale.labels.join(', ')}
                          </p>
                        )}
                      </div>
                    )}

                    {question.type === 'text' && (
                      <div className="ml-7">
                        <p className="text-sm text-gray-500">
                          Users will provide a text response
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
