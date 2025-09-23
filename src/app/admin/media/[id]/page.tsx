'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Video,
  Play,
  Clock,
  Zap,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  Youtube,
  Target,
  Lightbulb,
  MessageSquare,
  Wrench,
  Link as LinkIcon
} from 'lucide-react';
import { IMedia } from '@/models/database';

interface EnhancedMedia extends IMedia {
  topicName: string;
  subjectName: string;
  subjectId: string;
}

export default function ViewMediaPage() {
  const router = useRouter();
  const params = useParams();
  const mediaId = params?.id as string;

  const [media, setMedia] = useState<EnhancedMedia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string>('');

  useEffect(() => {
    if (mediaId) {
      fetchMedia();
    }
  }, [mediaId]);

  useEffect(() => {
    if (media?.youtubeUrl) {
      const youtubeId = extractYouTubeId(media.youtubeUrl);
      if (youtubeId) {
        setYoutubeEmbedUrl(`https://www.youtube.com/embed/${youtubeId}`);
      }
    }
  }, [media]);

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/media/${mediaId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Media not found');
        }
        throw new Error('Failed to fetch media');
      }

      const data = await response.json();
      setMedia(data);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!media) return;

    if (!confirm('Are you sure you want to delete this media item? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      router.push('/admin/media');
    } catch (err) {
      console.error('Error deleting media:', err);
      alert('Failed to delete media. Please try again.');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVideoTypeIcon = (videoType: string) => {
    switch (videoType) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'short': return <Play className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getVideoTypeLabel = (videoType: string) => {
    switch (videoType) {
      case 'video': return 'YouTube Video';
      case 'short': return 'YouTube Short';
      default: return videoType;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/media">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Media
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">View Media</h1>
            <p className="text-gray-600">Loading media details...</p>
          </div>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/media">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Media
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">View Media</h1>
            <p className="text-gray-600">Media not found</p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Media</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchMedia} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/media">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Media
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">View Media</h1>
            <p className="text-gray-600">{media.subjectName} → {media.topicName}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <a href={media.youtubeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open YouTube
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/media/${media._id}/edit`}>
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

      {/* Media Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getVideoTypeIcon(media.videoType)}
                <Badge variant="outline" className="text-xs">
                  {getVideoTypeLabel(media.videoType)}
                </Badge>
                {media.videoType === 'video' && (
                  <Badge variant="outline" className="text-xs">
                    #{media.order}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl mb-2">{media.title}</CardTitle>
              <div className="flex items-center gap-3">
                <Badge className={getDifficultyColor(media.difficulty)} variant="outline">
                  {media.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Zap className="w-4 h-4" />
                  {media.xpReward} XP
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {media.estimatedMinutes} min
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: media.description }}
          />
        </CardContent>
      </Card>

      {/* YouTube Video */}
      {youtubeEmbedUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              Video Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video">
              <iframe
                src={youtubeEmbedUrl}
                title={media.title}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pre-Video Content - Only for Videos */}
      {media.videoType === 'video' && media.preVideoContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Pre-Video Content
            </CardTitle>
            <CardDescription>Content to review before watching the video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Learning Objectives */}
            {media.preVideoContent.learningObjectives && media.preVideoContent.learningObjectives.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Learning Objectives
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  {media.preVideoContent.learningObjectives.map((objective, index) => (
                    <li key={index} className="text-gray-700">{objective}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {media.preVideoContent.prerequisites && media.preVideoContent.prerequisites.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Prerequisites
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  {media.preVideoContent.prerequisites.map((prereq, index) => (
                    <li key={index} className="text-gray-700">{prereq}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Terms */}
            {media.preVideoContent.keyTerms && media.preVideoContent.keyTerms.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Key Terms
                </h4>
                <div className="grid gap-3">
                  {media.preVideoContent.keyTerms.map((term, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <dt className="font-medium text-gray-900">{term.term}</dt>
                      <dd className="text-gray-700 mt-1">{term.definition}</dd>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Post-Video Content - Only for Videos */}
      {media.videoType === 'video' && media.postVideoContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Post-Video Content
            </CardTitle>
            <CardDescription>Content to review after watching the video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Concepts */}
            {media.postVideoContent.keyConcepts && media.postVideoContent.keyConcepts.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Key Concepts
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  {media.postVideoContent.keyConcepts.map((concept, index) => (
                    <li key={index} className="text-gray-700">{concept}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reflection Questions */}
            {media.postVideoContent.reflectionQuestions && media.postVideoContent.reflectionQuestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Reflection Questions
                </h4>
                <div className="space-y-2">
                  {media.postVideoContent.reflectionQuestions.map((question, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                      <p className="text-gray-700">{question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practical Applications */}
            {media.postVideoContent.practicalApplications && media.postVideoContent.practicalApplications.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Practical Applications
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  {media.postVideoContent.practicalApplications.map((application, index) => (
                    <li key={index} className="text-gray-700">{application}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Resources */}
            {media.postVideoContent.additionalResources && media.postVideoContent.additionalResources.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Additional Resources
                </h4>
                <div className="space-y-2">
                  {media.postVideoContent.additionalResources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-600 hover:underline">{resource.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quiz Questions - Only for Shorts */}
      {media.videoType === 'short' && media.quizQuestions && media.quizQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Quiz Questions
            </CardTitle>
            <CardDescription>Questions to test understanding after watching the short</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {media.quizQuestions.map((quiz, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-3">Question {index + 1}</h4>
                <p className="text-gray-800 mb-4">{quiz.question}</p>

                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-gray-600">Options:</p>
                  {quiz.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-2 rounded border ${
                        optionIndex === quiz.correctAnswer
                          ? 'bg-green-100 border-green-300 text-green-800'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {optionIndex === quiz.correctAnswer && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span>
                        <span>{option}</span>
                        {optionIndex === quiz.correctAnswer && (
                          <Badge className="ml-auto bg-green-600 text-white text-xs">Correct</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {quiz.explanation && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-medium text-blue-800 mb-1">Explanation:</p>
                    <p className="text-blue-700 text-sm">{quiz.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}