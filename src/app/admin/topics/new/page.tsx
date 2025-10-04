'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageUrlInput } from '@/components/ui/image-url-input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ISubject } from '@/models/database';

interface TopicFormData {
  name: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  subjectId: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  isUnlocked: boolean;
}

export default function NewTopicPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TopicFormData>({
    name: '',
    description: '',
    longDescription: '',
    imageUrl: '',
    subjectId: '',
    difficulty: 'Beginner',
    isUnlocked: true,
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setSubjectsLoading(true);
      const response = await fetch('/api/subjects?includeEmpty=true');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
        
        // Auto-select first subject if only one exists
        if (data.length === 1) {
          setFormData(prev => ({ ...prev, subjectId: data[0]._id }));
        }
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleInputChange = (field: keyof TopicFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Topic name is required';
    if (!formData.description.trim()) return 'Topic description is required';
    if (!formData.subjectId) return 'Please select a subject';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create topic');
      }

      const newTopic = await response.json();
      
      // Redirect to topics list with success message
      router.push('/admin/topics?created=' + encodeURIComponent(newTopic.name));
    } catch (err) {
      console.error('Error creating topic:', err);
      setError(err instanceof Error ? err.message : 'Failed to create topic');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/topics">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Topic</h1>
          <p className="text-gray-600">Add a new learning topic to a subject</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <X className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Topic Form */}
      <Card>
        <CardHeader>
          <CardTitle>Topic Information</CardTitle>
          <CardDescription>
            Enter the details for the new topic. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject Selection */}
            <div className="space-y-2">
              <Label htmlFor="subjectId">Subject *</Label>
              {subjectsLoading ? (
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ) : subjects.length === 0 ? (
                <div className="text-sm text-red-600">
                  No subjects available. Please create a subject first.
                </div>
              ) : (
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) => handleInputChange('subjectId', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject._id.toString()} value={subject._id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Topic Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Concrete Mix Design"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level *</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced') => 
                    handleInputChange('difficulty', value)
                  }
                  disabled={isLoading}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of this topic..."
                rows={2}
                disabled={isLoading}
              />
            </div>

            <RichTextEditor
              label="Long Description (optional)"
              value={formData.longDescription}
              onChange={(value) => handleInputChange('longDescription', value)}
              placeholder="Detailed description explaining what students will learn in this topic..."
              disabled={isLoading}
              rows={4}
            />

            <ImageUrlInput
              label="Topic Image (optional)"
              description="Enter a URL for an image to represent this topic"
              value={formData.imageUrl}
              onChange={(url) => handleInputChange('imageUrl', url)}
              disabled={isLoading}
              placeholder="https://example.com/topic-image.jpg"
            />


            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isUnlocked">Published Status</Label>
                  <p className="text-sm text-gray-500">
                    Published topics are visible to students
                  </p>
                </div>
                <Switch
                  id="isUnlocked"
                  checked={formData.isUnlocked}
                  onCheckedChange={(checked) => handleInputChange('isUnlocked', checked)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/topics')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || subjects.length === 0}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Topic
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}