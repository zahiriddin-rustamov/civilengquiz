'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, GripVertical, Save, FileText, AlertCircle, CheckCircle, Edit3, Calculator, Shuffle } from 'lucide-react';
import { Types } from 'mongoose';

interface QuestionWithData {
  _id: Types.ObjectId;
  topicId: Types.ObjectId;
  sectionId: Types.ObjectId;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'numerical' | 'matching';
  text: string;
  imageUrl?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  estimatedMinutes: number;
  order: number;
  data: any;
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
  topicName: string;
  subjectName: string;
  sectionName: string;
  sectionOrder: number;
}

interface SectionGroup {
  sectionId: string;
  sectionName: string;
  sectionOrder: number;
  questions: QuestionWithData[];
}

const questionTypeConfig = {
  'multiple-choice': { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', label: 'Multiple Choice' },
  'true-false': { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'True/False' },
  'fill-in-blank': { icon: Edit3, color: 'bg-purple-100 text-purple-800', label: 'Fill in Blank' },
  'numerical': { icon: Calculator, color: 'bg-orange-100 text-orange-800', label: 'Numerical' },
  'matching': { icon: Shuffle, color: 'bg-pink-100 text-pink-800', label: 'Matching' }
};

export default function QuestionsReorderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams?.get('topicId');

  const [sections, setSections] = useState<SectionGroup[]>([]);
  const [topicInfo, setTopicInfo] = useState<{ topicName: string; subjectName: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ sectionIndex: number; questionIndex: number } | null>(null);

  useEffect(() => {
    if (!topicId) {
      router.push('/admin/questions');
      return;
    }
    fetchQuestions();
  }, [topicId, router]);

  const groupQuestionsBySection = (questions: QuestionWithData[]): SectionGroup[] => {
    const sectionMap = new Map<string, SectionGroup>();

    questions.forEach(question => {
      if (!question.sectionId || !question.sectionName) {
        console.warn('Question missing section info:', question);
        return;
      }

      const sectionId = question.sectionId.toString();

      if (!sectionMap.has(sectionId)) {
        sectionMap.set(sectionId, {
          sectionId,
          sectionName: question.sectionName,
          sectionOrder: question.sectionOrder || 0,
          questions: []
        });
      }

      sectionMap.get(sectionId)!.questions.push(question);
    });

    // Convert to array and sort sections by order
    const sortedSections = Array.from(sectionMap.values()).sort((a, b) => a.sectionOrder - b.sectionOrder);

    // Sort questions within each section by order
    sortedSections.forEach(section => {
      section.questions.sort((a, b) => a.order - b.order);
    });

    return sortedSections;
  };

  const fetchQuestions = async () => {
    if (!topicId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch questions for this topic
      const response = await fetch(`/api/questions?topicId=${topicId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      console.log('Fetched questions data:', data);

      if (data.questions && data.questions.length > 0) {
        setTopicInfo({
          topicName: data.questions[0].topicName,
          subjectName: data.questions[0].subjectName
        });
      }

      // Group questions by sections
      const groupedSections = groupQuestionsBySection(data.questions);
      setSections(groupedSections);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, sectionIndex: number, questionIndex: number) => {
    setDraggedItem({ sectionIndex, questionIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropSectionIndex: number, dropQuestionIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { sectionIndex: dragSectionIndex, questionIndex: dragQuestionIndex } = draggedItem;

    // If dropping in the same position, do nothing
    if (dragSectionIndex === dropSectionIndex && dragQuestionIndex === dropQuestionIndex) {
      setDraggedItem(null);
      return;
    }

    const newSections = [...sections];
    const draggedQuestion = newSections[dragSectionIndex].questions[dragQuestionIndex];

    // Remove the dragged question from its original section
    newSections[dragSectionIndex].questions.splice(dragQuestionIndex, 1);

    // Insert the question into the new position
    newSections[dropSectionIndex].questions.splice(dropQuestionIndex, 0, draggedQuestion);

    setSections(newSections);
    setDraggedItem(null);
  };

  const handleSaveOrder = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Prepare the order updates for each section
      const sectionUpdates = sections.map(section => {
        const questionUpdates = section.questions.map((question, index) => ({
          questionId: question._id.toString(),
          order: index + 1,
          sectionId: section.sectionId
        }));

        return {
          sectionId: section.sectionId,
          questions: questionUpdates
        };
      });

      const response = await fetch('/api/admin/questions/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId,
          sections: sectionUpdates
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save order');
      }

      // Navigate back to questions page
      router.push('/admin/questions');
    } catch (err) {
      console.error('Error saving order:', err);
      setError(err instanceof Error ? err.message : 'Failed to save order');
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
            <Link href="/admin/questions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Questions
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reorder Questions</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded w-full"></div>
          <div className="h-20 bg-gray-200 rounded w-full"></div>
          <div className="h-20 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/questions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Questions
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reorder Questions</h1>
            <p className="text-gray-600">Error loading questions</p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/questions">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Questions
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reorder Questions</h1>
          {topicInfo && (
            <p className="text-gray-600">
              {topicInfo.subjectName} → {topicInfo.topicName}
            </p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <GripVertical className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">
                Drag and drop questions to reorder them within sections or move them between sections. Questions can be moved between any sections within this topic. The order determines the sequence students will see when practicing each section.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No questions to reorder</h3>
              <p className="mt-1 text-sm text-gray-500">
                This topic doesn't have any questions yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Reorderable Question List by Sections */}
          <div className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <Card key={section.sectionId}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Section {section.sectionOrder}: {section.sectionName}</span>
                  </CardTitle>
                  <CardDescription>
                    {section.questions.length} questions • Drag questions to reorder within section or move between sections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {section.questions.length === 0 ? (
                    <div
                      className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, sectionIndex, 0)}
                    >
                      <FileText className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No questions in this section</p>
                      <p className="text-xs text-gray-400">Drop questions here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {section.questions.map((question, questionIndex) => {
                        const typeConfig = questionTypeConfig[question.type];
                        const IconComponent = typeConfig?.icon || FileText;
                        const isDragged = draggedItem?.sectionIndex === sectionIndex && draggedItem?.questionIndex === questionIndex;

                        return (
                          <div
                            key={question._id.toString()}
                            draggable
                            onDragStart={(e) => handleDragStart(e, sectionIndex, questionIndex)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, sectionIndex, questionIndex)}
                            className={`
                              flex items-center space-x-4 p-4 border rounded-lg cursor-move transition-all
                              hover:bg-gray-50 hover:border-gray-300
                              ${isDragged ? 'opacity-50 scale-95' : ''}
                            `}
                          >
                            {/* Drag Handle */}
                            <GripVertical className="w-5 h-5 text-gray-400" />

                            {/* Order Number within Section */}
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                              {questionIndex + 1}
                            </div>

                            {/* Question Type Icon */}
                            <Badge className={typeConfig?.color || 'bg-gray-100 text-gray-800'} variant="outline">
                              <IconComponent className="w-3 h-3 mr-1" />
                              {typeConfig?.label || question.type}
                            </Badge>

                            {/* Question Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {question.text}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center space-x-2">
                                <span>{typeConfig?.label || question.type}</span>
                                {question.explanation && <span>• Has explanation</span>}
                                {question.imageUrl && <span>• Has image</span>}
                              </div>
                            </div>

                            {/* Metadata */}
                            <div className="flex items-center space-x-2">
                              <Badge className={getDifficultyColor(question.difficulty)}>
                                {question.difficulty}
                              </Badge>
                              <span className="text-sm text-gray-600">{question.xpReward} XP</span>
                              <span className="text-sm text-gray-600">
                                {question.estimatedMinutes} min
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" asChild>
              <Link href="/admin/questions">Cancel</Link>
            </Button>
            <Button onClick={handleSaveOrder} disabled={isSaving}>
              {isSaving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Order
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}