'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FlashcardComponent } from '@/components/flashcards/FlashcardComponent';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CreditCard,
  BookOpen,
  Clock,
  Zap,
  Tag,
  Loader2,
  Image as ImageIcon,
  RotateCw
} from 'lucide-react';

interface FlashcardData {
  _id: string;
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
  topicName: string;
  subjectName: string;
  createdAt: string;
  updatedAt: string;
}

export default function ViewFlashcardPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [flashcard, setFlashcard] = useState<FlashcardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFlashcard();
  }, [resolvedParams.id]);

  const fetchFlashcard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/flashcards/${resolvedParams.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch flashcard');
      }

      const data = await response.json();
      setFlashcard(data);
    } catch (err) {
      console.error('Error fetching flashcard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load flashcard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this flashcard? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/flashcards/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete flashcard');
      }

      router.push('/admin/flashcards');
    } catch (err) {
      console.error('Error deleting flashcard:', err);
      alert('Failed to delete flashcard. Please try again.');
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
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/flashcards">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Flashcards
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">View Flashcard</h1>
            <p className="text-gray-600">Flashcard details and preview</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading flashcard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !flashcard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/flashcards">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Flashcards
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">View Flashcard</h1>
            <p className="text-gray-600">Flashcard details and preview</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
              <p className="text-gray-600">{error || 'Flashcard not found'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/flashcards">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Flashcards
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">View Flashcard</h1>
            <p className="text-gray-600">Flashcard details and preview</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/flashcards/${resolvedParams.id}/edit`}>
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Flashcard Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Flashcard */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Flashcard Preview
              </CardTitle>
              <CardDescription>
                Interactive preview with the same experience students will have
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <FlashcardComponent
                flashcard={{
                  id: flashcard._id,
                  front: flashcard.front,
                  back: flashcard.back,
                  difficulty: flashcard.difficulty,
                  category: flashcard.category,
                  tags: flashcard.tags,
                  imageUrl: flashcard.imageUrl,
                  masteryLevel: 'New',
                  reviewCount: 0
                }}
                onMasteryUpdate={() => {}}
                showControls={false}
                autoFlip={false}
                showHeader={false}
              />
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Front Side</Label>
                <p className="mt-1 text-gray-900">{flashcard.front}</p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-gray-500">Back Side</Label>
                <p className="mt-1 text-gray-900">{flashcard.back}</p>
              </div>

              {flashcard.imageUrl && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Image</Label>
                    <div className="mt-2">
                      <img
                        src={flashcard.imageUrl}
                        alt="Flashcard image"
                        className="max-w-md h-48 object-contain border rounded"
                      />
                      <p className="mt-2 text-xs text-gray-500">{flashcard.imageUrl}</p>
                    </div>
                  </div>
                </>
              )}

              {flashcard.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tags</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {flashcard.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flashcard Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Subject</Label>
                <div className="mt-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{flashcard.subjectName}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Topic</Label>
                <div className="mt-1 font-medium">{flashcard.topicName}</div>
              </div>

              {flashcard.category && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Category</Label>
                  <Badge variant="outline" className="mt-1">{flashcard.category}</Badge>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-500">Difficulty</Label>
                <Badge className={`mt-1 ${getDifficultyColor(flashcard.difficulty)}`}>
                  {flashcard.difficulty}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">XP Reward</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{flashcard.xpReward} XP</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Estimated Time</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{flashcard.estimatedMinutes} minutes</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Order</Label>
                <span className="mt-1 block">#{flashcard.order}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Created</Label>
                <p className="mt-1 text-sm">
                  {new Date(flashcard.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                <p className="mt-1 text-sm">
                  {new Date(flashcard.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper component for labels
function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-medium ${className}`}>{children}</div>;
}