'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
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
import { ImageUpload } from '@/components/ui/image-upload';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ISubject } from '@/models/database';

interface SubjectFormData {
  name: string;
  description: string;
  imageUrl: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  xpReward: number;
  order: number;
  isUnlocked: boolean;
  prerequisiteId: string;
}

export default function EditSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalSubject, setOriginalSubject] = useState<ISubject | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<{ _id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    description: '',
    imageUrl: '',
    difficulty: 'Beginner',
    estimatedHours: 1,
    xpReward: 100,
    order: 1,
    isUnlocked: true,
    prerequisiteId: 'none',
  });

  useEffect(() => {
    if (subjectId) {
      fetchSubject();
      fetchAvailableSubjects();
    }
  }, [subjectId]);

  const fetchAvailableSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const subjects = await response.json();
        // Filter out the current subject to prevent self-reference
        const filtered = subjects
          .filter((s: any) => s._id !== subjectId)
          .map((s: any) => ({ _id: s._id, name: s.name }));
        setAvailableSubjects(filtered);
      }
    } catch (err) {
      console.error('Error fetching available subjects:', err);
    }
  };

  const fetchSubject = async () => {
    try {
      setIsFetching(true);
      setError(null);
      
      const response = await fetch(`/api/subjects/${subjectId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Subject not found');
          return;
        }
        throw new Error('Failed to fetch subject');
      }
      
      const subject: ISubject = await response.json();
      setOriginalSubject(subject);
      
      // Populate form with existing data
      setFormData({
        name: subject.name,
        description: subject.description,
        imageUrl: subject.imageUrl || '',
        difficulty: subject.difficulty,
        estimatedHours: subject.estimatedHours,
        xpReward: subject.xpReward,
        order: subject.order,
        isUnlocked: subject.isUnlocked,
        prerequisiteId: subject.prerequisiteId?.toString() || 'none',
      });
    } catch (err) {
      console.error('Error fetching subject:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subject');
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (field: keyof SubjectFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Subject name is required';
    if (!formData.description.trim()) return 'Subject description is required';
    if (formData.estimatedHours < 1) return 'Estimated hours must be at least 1';
    if (formData.xpReward < 1) return 'XP reward must be at least 1';
    if (formData.order < 1) return 'Order must be at least 1';
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

      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subject');
      }

      const updatedSubject = await response.json();
      
      // Redirect to subjects list with success message
      router.push('/admin/subjects?updated=' + encodeURIComponent(updatedSubject.name));
    } catch (err) {
      console.error('Error updating subject:', err);
      setError(err instanceof Error ? err.message : 'Failed to update subject');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/subjects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subjects
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Subject</h1>
            <p className="text-gray-600">Loading subject details...</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-20 bg-gray-200 rounded w-full"></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !originalSubject) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/subjects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subjects
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Subject</h1>
            <p className="text-gray-600">Subject not found</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-2">⚠️ Error Loading Subject</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchSubject} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Edit Subject</h1>
          <p className="text-gray-600">Update subject information</p>
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
            Update the details for "{originalSubject?.name}". All fields marked with * are required.
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
                Students must complete this subject before accessing this subject
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

            <ImageUpload
              label="Subject Image (optional)"
              description="Upload an image to represent this subject"
              value={formData.imageUrl}
              onChange={(url) => handleInputChange('imageUrl', url)}
              disabled={isLoading}
              maxSizeKB={1024}
            />

            {/* Numerical Settings */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours *</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="1"
                  max="200"
                  value={formData.estimatedHours}
                  onChange={(e) => handleInputChange('estimatedHours', parseInt(e.target.value) || 1)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="xpReward">XP Reward *</Label>
                <Input
                  id="xpReward"
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.xpReward}
                  onChange={(e) => handleInputChange('xpReward', parseInt(e.target.value) || 100)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="order">Display Order *</Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.order}
                  onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
                  disabled={isLoading}
                />
              </div>
            </div>

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
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Subject
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