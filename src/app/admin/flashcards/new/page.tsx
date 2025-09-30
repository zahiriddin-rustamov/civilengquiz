'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X, Save, AlertCircle, CreditCard, Tag } from 'lucide-react';
import { ImageUrlInput } from '@/components/ui/image-url-input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { SettingsSection } from '@/components/admin/SettingsSection';
import { ISubject, ITopic } from '@/models/database';

interface FlashcardData {
  topicId: string;
  front: string;
  back: string;
  imageUrl?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  estimatedMinutes: number;
  order: number;
  tags: string[];
  category?: string;
}

export default function NewFlashcardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FlashcardData>({
    topicId: '',
    front: '',
    back: '',
    imageUrl: '',
    difficulty: 'Beginner',
    xpReward: 10,
    estimatedMinutes: 2,
    order: 1,
    tags: [],
    category: ''
  });

  const [currentTag, setCurrentTag] = useState('');

  useEffect(() => {
    fetchSubjects();

    // Pre-select topic if provided in URL
    const topicId = searchParams?.get('topicId');
    const duplicateId = searchParams?.get('duplicate');

    if (topicId) {
      // Don't set formData.topicId here - let fetchTopicAndSubject do it after topics are loaded
      fetchTopicAndSubject(topicId);
    }

    // Load flashcard to duplicate
    if (duplicateId) {
      fetchFlashcardToDuplicate(duplicateId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (formData.topicId) {
      fetchNextOrder(formData.topicId);
    }
  }, [formData.topicId, topics]);

  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.getElementById('flashcard-form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    fetchTopicsForSubject(subjectId);
    setFormData(prev => ({ ...prev, topicId: '' }));
  };

  const fetchTopicsForSubject = async (subjectId: string) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/topics`);
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchTopicAndSubject = async (topicId: string) => {
    try {
      const response = await fetch(`/api/topics/${topicId}?includeRelated=true`);
      if (response.ok) {
        const data = await response.json();
        console.log('Topic data received:', data);
        console.log('subjectId type:', typeof data.subjectId);
        console.log('subjectId value:', data.subjectId);

        // Handle both ObjectId and string formats for subjectId
        const subjectIdStr = typeof data.subjectId === 'object' && data.subjectId._id
          ? data.subjectId._id.toString()
          : (data.subjectId ? data.subjectId.toString() : '');

        console.log('Extracted subjectIdStr:', subjectIdStr);

        if (!subjectIdStr) {
          console.error('Failed to extract subjectId from topic data');
          return;
        }

        setSelectedSubject(subjectIdStr);
        setTopics(data.siblingTopics || []);

        // Re-set the topic selection AFTER topics are loaded to ensure it appears in dropdown
        setFormData(prev => ({ ...prev, topicId }));
      } else {
        console.error('Failed to fetch topic:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error fetching topic and subject:', err);
    }
  };

  const fetchNextOrder = async (topicId: string) => {
    try {
      const response = await fetch(`/api/admin/flashcards?topicId=${topicId}`);
      if (response.ok) {
        const data = await response.json();
        const nextOrder = (data.flashcards?.length || 0) + 1;
        setFormData(prev => ({ ...prev, order: nextOrder }));
      }
    } catch (err) {
      console.error('Error fetching flashcards:', err);
    }
  };

  const fetchFlashcardToDuplicate = async (flashcardId: string) => {
    try {
      const response = await fetch(`/api/admin/flashcards/${flashcardId}`);
      if (response.ok) {
        const flashcard = await response.json();
        setFormData({
          topicId: flashcard.topicId.toString(),
          front: flashcard.front + ' (Copy)',
          back: flashcard.back,
          imageUrl: flashcard.imageUrl || '',
          difficulty: flashcard.difficulty,
          xpReward: flashcard.xpReward,
          estimatedMinutes: flashcard.estimatedMinutes,
          order: 1, // Will be updated when topic is selected
          tags: [...flashcard.tags],
          category: flashcard.category || ''
        });

        // Set the subject for fetching topics
        if (flashcard.subjectId) {
          setSelectedSubject(flashcard.subjectId.toString());
          fetchTopicsForSubject(flashcard.subjectId.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching flashcard to duplicate:', err);
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.topicId || !formData.front.trim() || !formData.back.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          front: formData.front.trim(),
          back: formData.back.trim(),
          category: formData.category?.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create flashcard');
      }

      router.push('/admin/flashcards');
    } catch (err) {
      console.error('Error creating flashcard:', err);
      setError(err instanceof Error ? err.message : 'Failed to create flashcard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/flashcards">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Flashcards
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Flashcard</h1>
          <p className="text-gray-600">Add a new flashcard for spaced repetition learning</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form id="flashcard-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Setup</CardTitle>
            <CardDescription>Choose where this flashcard belongs and its basic properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject._id.toString()} value={subject._id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="topic">Topic *</Label>
                <Select
                  value={formData.topicId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, topicId: value }))}
                  disabled={topics.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(topic => (
                      <SelectItem key={topic._id.toString()} value={topic._id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category (optional)</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Definitions, Formulas, Concepts"
              />
            </div>
          </CardContent>
        </Card>

        {/* Flashcard Content */}
        <Card>
          <CardHeader>
            <CardTitle>Flashcard Content</CardTitle>
            <CardDescription>Create the front and back content for your flashcard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RichTextEditor
              label="Front Side (Question/Term) *"
              value={formData.front}
              onChange={(value) => setFormData(prev => ({ ...prev, front: value }))}
              placeholder="Enter the question, term, or concept to be shown on the front of the card..."
              disabled={isLoading}
              rows={3}
              required
            />

            <RichTextEditor
              label="Back Side (Answer/Definition) *"
              value={formData.back}
              onChange={(value) => setFormData(prev => ({ ...prev, back: value }))}
              placeholder="Enter the answer, definition, or explanation to be shown on the back of the card..."
              disabled={isLoading}
              rows={4}
              required
            />

            <ImageUrlInput
              label="Flashcard Image (optional)"
              description="Add an image to help illustrate your flashcard"
              value={formData.imageUrl || ''}
              onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              disabled={isLoading}
              placeholder="https://example.com/flashcard-image.jpg"
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Add tags to help organize and categorize your flashcard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tags">Add Tags</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="tags"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a tag and press Enter"
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Tags help with filtering and organization. Press Enter or click + to add.
              </p>
            </div>

            {formData.tags.length > 0 && (
              <div>
                <Label>Current Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Configure difficulty, XP reward, and time estimate</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsSection
              difficulty={formData.difficulty}
              xpReward={formData.xpReward}
              estimatedMinutes={formData.estimatedMinutes}
              onDifficultyChange={(difficulty) => setFormData(prev => ({ ...prev, difficulty }))}
              onXpRewardChange={(xpReward) => setFormData(prev => ({ ...prev, xpReward }))}
              onEstimatedMinutesChange={(estimatedMinutes) => setFormData(prev => ({ ...prev, estimatedMinutes }))}
            />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Flashcard Preview
            </CardTitle>
            <CardDescription>See how your flashcard will look to students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.front || formData.back ? (
              <div className="grid md:grid-cols-2 gap-4">
                {/* Front Preview */}
                <div className="p-6 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50">
                  <div className="text-xs font-medium text-indigo-600 mb-3">FRONT SIDE</div>
                  <div
                    className="text-gray-800 font-medium prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.front || '<span class="text-gray-400">Enter front content...</span>' }}
                  />
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Flashcard"
                      className="mt-3 max-w-full h-32 object-contain rounded"
                    />
                  )}
                </div>

                {/* Back Preview */}
                <div className="p-6 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
                  <div className="text-xs font-medium text-green-600 mb-3">BACK SIDE</div>
                  <div
                    className="text-gray-800 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.back || '<span class="text-gray-400">Enter back content...</span>' }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Flashcard Preview</p>
                <p className="text-sm">Enter content above to see preview</p>
              </div>
            )}

            {formData.tags.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/flashcards')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.topicId || !formData.front.trim() || !formData.back.trim()}
            title="Ctrl+Enter to save"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Flashcard
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}