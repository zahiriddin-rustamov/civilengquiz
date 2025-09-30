'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Star,
  CheckCircle,
  MessageSquare
} from 'lucide-react';

interface SurveyQuestion {
  id: string;
  type: 'rating' | 'multiple_choice' | 'text';
  question: string;
  required: boolean;
  options?: string[];
  scale?: { min: number; max: number; labels?: string[] };
}

interface SurveyFormData {
  title: string;
  description: string;
  triggerType: 'section_completion' | 'flashcard_completion' | 'media_completion' | '';
  targeting: {
    type: 'all' | 'specific_sections' | 'specific_topics' | 'specific_subjects';
    sectionIds: string[];
    topicIds: string[];
    subjectIds: string[];
  };
  questions: SurveyQuestion[];
  isActive: boolean;
}

const questionTypes = [
  { value: 'rating', label: 'Rating Scale', icon: Star },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: CheckCircle },
  { value: 'text', label: 'Text Response', icon: MessageSquare }
];

const triggerTypes = [
  { value: 'section_completion', label: 'Section Completion' },
  { value: 'flashcard_completion', label: 'Flashcard Completion' },
  { value: 'media_completion', label: 'Media Completion' }
];

export default function NewSurveyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SurveyFormData>({
    title: '',
    description: '',
    triggerType: '',
    targeting: {
      type: 'all',
      sectionIds: [],
      topicIds: [],
      subjectIds: []
    },
    questions: [],
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data for targeting dropdowns
  const [subjects, setSubjects] = useState<Array<{_id: string; name: string}>>([]);
  const [topics, setTopics] = useState<Array<{_id: string; name: string; subjectId: string}>>([]);
  const [sections, setSections] = useState<Array<{_id: string; name: string; topicId: string}>>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const addQuestion = (type: 'rating' | 'multiple_choice' | 'text') => {
    const newQuestion: SurveyQuestion = {
      id: crypto.randomUUID(),
      type,
      question: '',
      required: false,
      ...(type === 'multiple_choice' && { options: ['Option 1', 'Option 2'] }),
      ...(type === 'rating' && { scale: { min: 1, max: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] } })
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<SurveyQuestion>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const deleteQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const addOption = (questionId: string) => {
    updateQuestion(questionId, {
      options: [...(formData.questions.find(q => q.id === questionId)?.options || []), `Option ${(formData.questions.find(q => q.id === questionId)?.options?.length || 0) + 1}`]
    });
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (question?.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (question?.options) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  // Fetch data for targeting dropdowns
  const fetchTargetingData = async () => {
    try {
      setIsLoadingData(true);

      // Fetch subjects
      const subjectsResponse = await fetch('/api/subjects');
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
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load targeting data on component mount
  React.useEffect(() => {
    fetchTargetingData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Survey title is required');
      return;
    }

    if (!formData.triggerType) {
      setError('Trigger type is required');
      return;
    }

    if (formData.questions.length === 0) {
      setError('At least one question is required');
      return;
    }

    // Validate questions
    for (const question of formData.questions) {
      if (!question.question.trim()) {
        setError('All questions must have a question text');
        return;
      }

      if (question.type === 'multiple_choice' && (!question.options || question.options.length < 2)) {
        setError('Multiple choice questions must have at least 2 options');
        return;
      }

      if (question.type === 'rating' && (!question.scale || question.scale.min >= question.scale.max)) {
        setError('Rating questions must have valid scale with min < max');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create survey');
      }

      const survey = await response.json();
      router.push(`/admin/surveys/${survey._id}`);
    } catch (err) {
      console.error('Error creating survey:', err);
      setError(err instanceof Error ? err.message : 'Failed to create survey');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Survey</h1>
          <p className="text-gray-600">Create a new post-completion survey</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Set up the basic details for your survey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Survey Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter survey title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="triggerType">Trigger Type *</Label>
                <Select
                  value={formData.triggerType}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, triggerType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter survey description (optional)"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
              />
              <Label htmlFor="isActive">Survey is active</Label>
            </div>
          </CardContent>
        </Card>

        {/* Targeting Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Survey Targeting</CardTitle>
            <CardDescription>
              Configure which content this survey should target
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetingType">Apply survey to</Label>
              <Select
                value={formData.targeting.type}
                onValueChange={(value: any) => setFormData(prev => ({
                  ...prev,
                  targeting: {
                    ...prev.targeting,
                    type: value,
                    sectionIds: [],
                    topicIds: [],
                    subjectIds: []
                  }
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select targeting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All {formData.triggerType === 'section_completion' ? 'sections' :
                         formData.triggerType === 'flashcard_completion' ? 'flashcard topics' :
                         formData.triggerType === 'media_completion' ? 'media topics' : 'content'}
                  </SelectItem>
                  {formData.triggerType === 'section_completion' && (
                    <SelectItem value="specific_sections">Specific sections</SelectItem>
                  )}
                  <SelectItem value="specific_topics">Specific topics</SelectItem>
                  <SelectItem value="specific_subjects">Specific subjects</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show targeting options based on selection */}
            {formData.targeting.type === 'specific_sections' && formData.triggerType === 'section_completion' && (
              <div className="space-y-2">
                <Label>Select Sections</Label>
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {sections.map(section => (
                    <div key={section._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`section-${section._id}`}
                        checked={formData.targeting.sectionIds.includes(section._id)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            targeting: {
                              ...prev.targeting,
                              sectionIds: checked
                                ? [...prev.targeting.sectionIds, section._id]
                                : prev.targeting.sectionIds.filter(id => id !== section._id)
                            }
                          }));
                        }}
                      />
                      <Label htmlFor={`section-${section._id}`} className="text-sm">
                        {section.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.targeting.type === 'specific_topics' && (
              <div className="space-y-2">
                <Label>Select Topics</Label>
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {topics.map(topic => (
                    <div key={topic._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`topic-${topic._id}`}
                        checked={formData.targeting.topicIds.includes(topic._id)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            targeting: {
                              ...prev.targeting,
                              topicIds: checked
                                ? [...prev.targeting.topicIds, topic._id]
                                : prev.targeting.topicIds.filter(id => id !== topic._id)
                            }
                          }));
                        }}
                      />
                      <Label htmlFor={`topic-${topic._id}`} className="text-sm">
                        {topic.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.targeting.type === 'specific_subjects' && (
              <div className="space-y-2">
                <Label>Select Subjects</Label>
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {subjects.map(subject => (
                    <div key={subject._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subject-${subject._id}`}
                        checked={formData.targeting.subjectIds.includes(subject._id)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            targeting: {
                              ...prev.targeting,
                              subjectIds: checked
                                ? [...prev.targeting.subjectIds, subject._id]
                                : prev.targeting.subjectIds.filter(id => id !== subject._id)
                            }
                          }));
                        }}
                      />
                      <Label htmlFor={`subject-${subject._id}`} className="text-sm">
                        {subject.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLoadingData && (
              <div className="text-sm text-gray-500">Loading content options...</div>
            )}
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Survey Questions</CardTitle>
                <CardDescription>
                  Add questions to collect feedback from users
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                {questionTypes.map(type => {
                  const IconComponent = type.icon;
                  return (
                    <Button
                      key={type.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addQuestion(type.value as any)}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      {type.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {formData.questions.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No questions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add your first question using the buttons above
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">
                          Question {index + 1} ({questionTypes.find(t => t.value === question.type)?.label})
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Question Text *</Label>
                        <Input
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                          placeholder="Enter your question"
                          required
                        />
                      </div>

                      {question.type === 'multiple_choice' && (
                        <div className="space-y-2">
                          <Label>Options</Label>
                          <div className="space-y-2">
                            {question.options?.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                {question.options && question.options.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeOption(question.id, optionIndex)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(question.id)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                        </div>
                      )}

                      {question.type === 'rating' && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Scale Range</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                value={question.scale?.min || 1}
                                onChange={(e) => updateQuestion(question.id, {
                                  scale: { ...question.scale!, min: parseInt(e.target.value) || 1 }
                                })}
                                placeholder="Min"
                                min="1"
                                className="w-20"
                              />
                              <span>to</span>
                              <Input
                                type="number"
                                value={question.scale?.max || 5}
                                onChange={(e) => updateQuestion(question.id, {
                                  scale: { ...question.scale!, max: parseInt(e.target.value) || 5 }
                                })}
                                placeholder="Max"
                                min="2"
                                className="w-20"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`required-${question.id}`}
                          checked={question.required}
                          onCheckedChange={(checked) => updateQuestion(question.id, { required: checked as boolean })}
                        />
                        <Label htmlFor={`required-${question.id}`}>Required question</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/surveys">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Survey'}
          </Button>
        </div>
      </form>
    </div>
  );
}