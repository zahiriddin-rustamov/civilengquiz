'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Zap,
  CheckCircle,
  Edit3,
  Calculator,
  Shuffle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Types } from 'mongoose';

interface QuestionData {
  _id: Types.ObjectId;
  topicId: Types.ObjectId;
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
}

const questionTypeConfig = {
  'multiple-choice': { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', label: 'Multiple Choice' },
  'true-false': { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'True/False' },
  'fill-in-blank': { icon: Edit3, color: 'bg-purple-100 text-purple-800', label: 'Fill in Blank' },
  'numerical': { icon: Calculator, color: 'bg-orange-100 text-orange-800', label: 'Numerical' },
  'matching': { icon: Shuffle, color: 'bg-pink-100 text-pink-800', label: 'Matching' }
};

export default function QuestionViewPage() {
  const params = useParams();
  const router = useRouter();
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchQuestion(params.id as string);
    }
  }, [params.id]);

  const fetchQuestion = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/questions/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Question not found');
        }
        throw new Error('Failed to fetch question');
      }

      const data = await response.json();
      setQuestion(data);
    } catch (err) {
      console.error('Error fetching question:', err);
      setError(err instanceof Error ? err.message : 'Failed to load question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!question || !confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/questions/${question._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      router.push('/admin/questions');
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Failed to delete question. Please try again.');
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

  const renderQuestionData = (question: QuestionData) => {
    const typeConfig = questionTypeConfig[question.type];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Answer Options:</h4>
            <div className="space-y-2">
              {question.data.options.map((option: string, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    index === question.data.correctAnswer
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                      index === question.data.correctAnswer
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {index === question.data.correctAnswer && (
                      <Badge className="bg-green-100 text-green-800">Correct</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Correct Answer:</h4>
            <div className="flex items-center space-x-2">
              <Badge className={question.data.correctAnswer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {question.data.correctAnswer ? 'True' : 'False'}
              </Badge>
            </div>
          </div>
        );

      case 'fill-in-blank':
        return (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Blanks and Correct Answers:</h4>
            <div className="space-y-3">
              {question.data.blanks.map((blank: any, index: number) => (
                <div key={blank.id} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="font-medium text-sm text-gray-600 mb-2">Blank #{index + 1}</div>
                  <div className="flex flex-wrap gap-1">
                    {blank.correctAnswers.map((answer: string, answerIndex: number) => (
                      <Badge key={answerIndex} className="bg-blue-100 text-blue-800">
                        {answer}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'numerical':
        return (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Correct Answer:</h4>
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-100 text-blue-800">
                {question.data.correctAnswer}
              </Badge>
              {question.data.tolerance !== undefined && (
                <div className="text-sm text-gray-600">
                  ± {question.data.tolerance} tolerance
                </div>
              )}
            </div>
            {question.data.unit && (
              <div className="text-sm text-gray-600">
                Unit: {question.data.unit}
              </div>
            )}
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Matching Pairs:</h4>
            <div className="space-y-2">
              {question.data.pairs.map((pair: any, index: number) => (
                <div key={pair.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="font-medium">{pair.left}</div>
                  <div className="text-gray-400">↔</div>
                  <div className="font-medium">{pair.right}</div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-gray-500 italic">
            No preview available for this question type.
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/questions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Questions
            </Link>
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/questions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Questions
            </Link>
          </Button>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {error || 'Question not found'}
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={() => fetchQuestion(params.id as string)} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const typeConfig = questionTypeConfig[question.type];
  const IconComponent = typeConfig?.icon || FileText;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/questions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Questions
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Question Details</h1>
            <p className="text-gray-600">
              {question.subjectName} → {question.topicName}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/questions/${question._id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Question Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className={typeConfig?.color || 'bg-gray-100 text-gray-800'} variant="outline">
                  <IconComponent className="w-3 h-3 mr-1" />
                  {typeConfig?.label || question.type}
                </Badge>
                <Badge className={getDifficultyColor(question.difficulty)} variant="outline">
                  {question.difficulty}
                </Badge>
                <Badge variant="outline">#{question.order}</Badge>
              </div>
              <CardTitle className="text-lg">Question Text</CardTitle>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>{question.xpReward} XP</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{question.estimatedMinutes}m</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Text */}
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: question.text }} />
          </div>

          {/* Question Image */}
          {question.imageUrl && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Image:</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={question.imageUrl}
                  alt="Question image"
                  className="max-w-full h-auto rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Question-specific Data */}
          {renderQuestionData(question)}

          {/* Explanation */}
          {question.explanation && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Explanation:</h4>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="prose max-w-none text-sm">
                  <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Question ID:</span>
              <div className="font-mono text-xs text-gray-500 break-all">{question._id.toString()}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Topic ID:</span>
              <div className="font-mono text-xs text-gray-500 break-all">{question.topicId.toString()}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Created:</span>
              <div className="text-gray-500">{new Date(question.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Last Updated:</span>
              <div className="text-gray-500">{new Date(question.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}