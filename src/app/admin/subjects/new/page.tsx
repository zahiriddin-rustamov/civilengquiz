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

interface SubjectFormData {
  name: string;
  description: string;
  imageUrl: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  isUnlocked: boolean;
  prerequisiteId: string;
}

export default function NewSubjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<{ _id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    description: '',
    imageUrl: '',
    difficulty: 'Beginner',
    isUnlocked: true,
    prerequisiteId: 'none',
  });

  useEffect(() => {
    fetchAvailableSubjects();
  }, []);

  const fetchAvailableSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const subjects = await response.json();
        setAvailableSubjects(subjects.map((s: any) => ({ _id: s._id, name: s.name })));
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };


  const handleInputChange = (field: keyof SubjectFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Subject name is required';
    if (!formData.description.trim()) return 'Subject description is required';
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
      // Prepare the data, converting "none" or empty prerequisiteId to undefined
      const submitData = {
        ...formData,
        prerequisiteId: formData.prerequisiteId && formData.prerequisiteId !== 'none' ? formData.prerequisiteId : undefined
      };

      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subject');
      }

      const newSubject = await response.json();
      
      // Redirect to subjects list with success message
      router.push('/admin/subjects?created=' + encodeURIComponent(newSubject.name));
    } catch (err) {
      console.error('Error creating subject:', err);
      setError(err instanceof Error ? err.message : 'Failed to create subject');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/subjects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subjects
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Subject</h1>
          <p className="text-gray-600">Add a new learning subject to your platform</p>
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

      {/* Subject Form */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Information</CardTitle>
          <CardDescription>
            Enter the details for the new subject. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Structural Engineering"
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
              <Label htmlFor="prerequisite">Prerequisite Subject (optional)</Label>
              <Select
                value={formData.prerequisiteId}
                onValueChange={(value) => handleInputChange('prerequisiteId', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select prerequisite subject (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No prerequisite</SelectItem>
                  {availableSubjects.map(subject => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Students must complete this subject before accessing the new subject
              </p>
            </div>

            <RichTextEditor
              label="Description *"
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
              placeholder="Provide a detailed description of what students will learn in this subject..."
              disabled={isLoading}
              rows={4}
              required
            />

            <ImageUrlInput
              label="Subject Image (optional)"
              description="Enter a URL for an image to represent this subject"
              value={formData.imageUrl}
              onChange={(url) => handleInputChange('imageUrl', url)}
              disabled={isLoading}
              placeholder="https://example.com/subject-image.jpg"
            />


            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isUnlocked">Published Status</Label>
                  <p className="text-sm text-gray-500">
                    Published subjects are visible to students
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
                onClick={() => router.push('/admin/subjects')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Subject
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