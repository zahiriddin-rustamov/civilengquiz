'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, RotateCcw, GripVertical, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Subject {
  _id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  order: number;
  isUnlocked: boolean;
  estimatedHours: number;
  xpReward: number;
}

export default function ReorderSubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [originalOrder, setOriginalOrder] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    // Check if order has changed
    const orderChanged = subjects.some((subject, index) =>
      originalOrder[index]?._id !== subject._id
    );
    setHasChanges(orderChanged);
  }, [subjects, originalOrder]);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/subjects');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }

      const data = await response.json();
      const sortedData = data.sort((a: Subject, b: Subject) => a.order - b.order);
      setSubjects(sortedData);
      setOriginalOrder([...sortedData]);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newSubjects = [...subjects];
    const draggedSubject = newSubjects[draggedIndex];

    // Remove the dragged item
    newSubjects.splice(draggedIndex, 1);

    // Insert it at the new position
    newSubjects.splice(dropIndex, 0, draggedSubject);

    setSubjects(newSubjects);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Create array of subject IDs in the new order
      const subjectIds = subjects.map(subject => subject._id);

      const response = await fetch('/api/subjects/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subjectIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save new order');
      }

      setSuccess('Subject order updated successfully!');
      setOriginalOrder([...subjects]);
      setHasChanges(false);

      // Redirect back to subjects list after a short delay
      setTimeout(() => {
        router.push('/admin/subjects');
      }, 1500);

    } catch (err) {
      console.error('Error saving order:', err);
      setError(err instanceof Error ? err.message : 'Failed to save new order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSubjects([...originalOrder]);
    setHasChanges(false);
    setError(null);
    setSuccess(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/admin/subjects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subjects
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reorder Subjects</h1>
            <p className="text-gray-600">Loading subjects...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" asChild>
          <Link href="/admin/subjects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subjects
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reorder Subjects</h1>
          <p className="text-gray-600">Drag and drop subjects to change their order</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>
            Drag subjects up or down to reorder them. The order will determine how subjects appear to students.
            Arrange subjects in a logical learning progression from basic to advanced topics.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Subject List */}
      <div className="space-y-3">
        {subjects.map((subject, index) => (
          <Card
            key={subject._id}
            className={`transition-all duration-200 cursor-move ${
              draggedIndex === index
                ? 'opacity-50 scale-105 rotate-2'
                : 'hover:shadow-md'
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <CardContent className="pt-4">
              <div className="flex items-center space-x-4">
                {/* Drag Handle */}
                <div className="flex flex-col items-center text-gray-400">
                  <GripVertical className="w-5 h-5" />
                  <span className="text-xs font-medium">{index + 1}</span>
                </div>

                {/* Subject Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {subject.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {subject.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge className={getDifficultyColor(subject.difficulty)}>
                        {subject.difficulty}
                      </Badge>
                      <Badge variant={subject.isUnlocked ? "default" : "secondary"}>
                        {subject.isUnlocked ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>{subject.estimatedHours}h</span>
                    <span>{subject.xpReward} XP</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between sticky bottom-6 bg-white p-4 rounded-lg border shadow-md">
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <span className="text-sm text-blue-600 font-medium">
              You have unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Order
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}