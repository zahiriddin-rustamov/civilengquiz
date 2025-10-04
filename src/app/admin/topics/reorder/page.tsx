'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, GripVertical, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ISubject } from '@/models/database';
import { Types } from 'mongoose';

interface TopicForReorder {
  _id: Types.ObjectId;
  name: string;
  description: string;
  subjectId: Types.ObjectId;
  subjectName: string;
  order: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  xpReward: number;
  isUnlocked: boolean;
}

interface SubjectWithTopics {
  _id: Types.ObjectId;
  name: string;
  topics: TopicForReorder[];
}

export default function ReorderTopicsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [originalSubjects, setOriginalSubjects] = useState<SubjectWithTopics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ subjectId: string; topicIndex: number } | null>(null);

  useEffect(() => {
    fetchTopicsGroupedBySubject();
  }, []);

  useEffect(() => {
    // Check if order has changed
    const hasOrderChanged = subjects.some((subject, subjectIndex) =>
      subject.topics.some((topic, topicIndex) => {
        const originalSubject = originalSubjects[subjectIndex];
        const originalTopic = originalSubject?.topics[topicIndex];
        return !originalTopic || topic._id.toString() !== originalTopic._id.toString();
      })
    );
    setHasChanges(hasOrderChanged);
  }, [subjects, originalSubjects]);

  const fetchTopicsGroupedBySubject = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch subjects and topics
      const [subjectsResponse, topicsResponse] = await Promise.all([
        fetch('/api/subjects?includeEmpty=true'),
        fetch('/api/topics')
      ]);

      if (!subjectsResponse.ok || !topicsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const subjectsData = await subjectsResponse.json();
      const topicsData = await topicsResponse.json();

      // Group topics by subject
      const groupedData: SubjectWithTopics[] = subjectsData.map((subject: ISubject) => ({
        _id: subject._id,
        name: subject.name,
        topics: topicsData
          .filter((topic: any) => {
            const subjectId = typeof topic.subjectId === 'object' ? topic.subjectId._id : topic.subjectId;
            return subjectId.toString() === subject._id.toString();
          })
          .sort((a: any, b: any) => a.order - b.order)
          .map((topic: any) => ({
            ...topic,
            subjectId: typeof topic.subjectId === 'object' ? topic.subjectId._id : topic.subjectId,
            subjectName: subject.name
          }))
      }));

      setSubjects(groupedData);
      setOriginalSubjects(JSON.parse(JSON.stringify(groupedData))); // Deep copy
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load topics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, subjectId: string, topicIndex: number) => {
    setDraggedItem({ subjectId, topicIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSubjectId: string, targetIndex: number) => {
    e.preventDefault();

    if (!draggedItem) return;

    const sourceSubjectIndex = subjects.findIndex(s => s._id.toString() === draggedItem.subjectId);
    const targetSubjectIndex = subjects.findIndex(s => s._id.toString() === targetSubjectId);

    if (sourceSubjectIndex === -1 || targetSubjectIndex === -1) return;

    const newSubjects = [...subjects];
    const sourceSubject = newSubjects[sourceSubjectIndex];
    const targetSubject = newSubjects[targetSubjectIndex];

    // Only allow reordering within the same subject
    if (sourceSubjectIndex !== targetSubjectIndex) {
      setDraggedItem(null);
      return;
    }

    // Remove the dragged topic from its current position
    const [draggedTopic] = sourceSubject.topics.splice(draggedItem.topicIndex, 1);

    // Insert it at the new position
    targetSubject.topics.splice(targetIndex, 0, draggedTopic);

    setSubjects(newSubjects);
    setDraggedItem(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Prepare update data - only topics that need order updates
      const updates: { topicId: string; order: number }[] = [];

      subjects.forEach(subject => {
        subject.topics.forEach((topic, index) => {
          const newOrder = index + 1;
          updates.push({ topicId: topic._id.toString(), order: newOrder });
        });
      });

      const response = await fetch('/api/topics/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to save topic order');
      }

      // Update original data to reflect the new order
      setOriginalSubjects(JSON.parse(JSON.stringify(subjects)));

      // Navigate back with success message
      router.push('/admin/topics?reordered=true');
    } catch (err) {
      console.error('Error saving topic order:', err);
      setError(err instanceof Error ? err.message : 'Failed to save topic order');
    } finally {
      setIsSaving(false);
    }
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
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/topics">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Topics
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reorder Topics</h1>
            <p className="text-gray-600">Loading topics...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded w-full"></div>
          <div className="h-32 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/topics">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Topics
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reorder Topics</h1>
            <p className="text-gray-600">Drag and drop topics to reorder them within each subject</p>
          </div>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving}>
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
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">
            <strong>Instructions:</strong> Drag and drop topics to reorder them within each subject.
            Topics cannot be moved between subjects. The order determines how topics appear to students.
          </p>
        </CardContent>
      </Card>

      {/* Subjects with Topics */}
      <div className="space-y-6">
        {subjects.map((subject, subjectIndex) => (
          <Card key={subject._id.toString()}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <CardTitle>{subject.name}</CardTitle>
                <Badge variant="outline">{subject.topics.length} topics</Badge>
              </div>
              <CardDescription>
                Reorder topics within this subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subject.topics.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No topics in this subject</p>
              ) : (
                <div className="space-y-2">
                  {subject.topics.map((topic, topicIndex) => (
                    <div
                      key={topic._id.toString()}
                      draggable
                      onDragStart={(e) => handleDragStart(e, subject._id.toString(), topicIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, subject._id.toString(), topicIndex)}
                      className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:bg-gray-50 cursor-move transition-colors"
                    >
                      <GripVertical className="w-5 h-5 text-gray-400" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">{topic.name}</span>
                          <Badge className={getDifficultyColor(topic.difficulty)} variant="outline">
                            {topic.difficulty}
                          </Badge>
                          <Badge variant={topic.isUnlocked ? "default" : "secondary"}>
                            {topic.isUnlocked ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">{topic.description}</p>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{topic.estimatedMinutes}m</span>
                        <span>{topic.xpReward} XP</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          #{topicIndex + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}