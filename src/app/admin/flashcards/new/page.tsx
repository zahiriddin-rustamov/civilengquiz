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
import { ISubject, ITopic } from '@/models/database';

interface FlashcardData {
  topicId: string;
  front: string;
  back: string;
  imageUrl?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  order: number;
  tags: string[];
  category?: string;
}

export default function NewFlashcardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FlashcardData>({
    topicId: '',
    front: '',
    back: '',
    imageUrl: '',
    difficulty: 'Beginner',
    points: 5,
    order: 1,
    tags: [],
    category: ''
  });

  const [currentTag, setCurrentTag] = useState('');

  useEffect(() => {
    fetchSubjects();
    
    // Pre-select topic if provided in URL
    const topicId = searchParams?.get('topicId');
    if (topicId) {
      setFormData(prev => ({ ...prev, topicId }));
      fetchTopicAndSubject(topicId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (formData.topicId) {
      fetchNextOrder(formData.topicId);
    }
  }, [formData.topicId, topics]);

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

  const fetchTopicsForSubject = async (subjectId: string) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/topics`);
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
        setFormData(prev => ({ ...prev, topicId: '' }));
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchTopicAndSubject = async (topicId: string) => {
    try {
      const response = await fetch(`/api/topics/${topicId}`);
      if (response.ok) {
        const topic = await response.json();
        const subjectResponse = await fetch(`/api/subjects/${topic.subjectId}/topics`);
        if (subjectResponse.ok) {
          const topicsData = await subjectResponse.json();
          setTopics(topicsData);
        }
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" asChild>
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

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Configure the fundamental properties of your flashcard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select onValueChange={(value) => fetchTopicsForSubject(value)}>
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
                    <Label htmlFor="topic">Topic</Label>
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
                  <Label htmlFor="front">Front Side (Question/Term)</Label>
                  <Textarea
                    id="front"
                    value={formData.front}
                    onChange={(e) => setFormData(prev => ({ ...prev, front: e.target.value }))}
                    placeholder="Enter the question, term, or concept to be shown on the front of the card..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="back">Back Side (Answer/Definition)</Label>
                  <Textarea
                    id="back"
                    value={formData.back}
                    onChange={(e) => setFormData(prev => ({ ...prev, back: e.target.value }))}
                    placeholder="Enter the answer, definition, or explanation to be shown on the back of the card..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="imageUrl">Image URL (optional)</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="max-w-xs h-32 object-cover rounded border"
                        onError={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags and Categories</CardTitle>
                <CardDescription>Organize your flashcard with tags and categories for better management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category">Category (optional)</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Definitions, Formulas, Concepts"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      id="tags"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a tag and press Enter"
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
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
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Flashcard Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="points">XP Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 5 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Flashcard Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.front || formData.back ? (
                  <>
                    {/* Front Preview */}
                    <div className="p-4 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50">
                      <div className="text-xs font-medium text-indigo-600 mb-2">FRONT</div>
                      <div className="text-gray-800 font-medium">
                        {formData.front || 'Enter front content...'}
                      </div>
                    </div>
                    
                    {/* Back Preview */}
                    <div className="p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
                      <div className="text-xs font-medium text-green-600 mb-2">BACK</div>
                      <div className="text-gray-800">
                        {formData.back || 'Enter back content...'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Enter content to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" asChild>
            <Link href="/admin/flashcards">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              'Creating...'
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