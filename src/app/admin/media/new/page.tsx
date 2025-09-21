'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, Video, Play, Youtube } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ISubject, ITopic } from '@/models/database';

interface MediaData {
  topicId: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  estimatedMinutes: number;
  order: number;
  youtubeUrl: string;
  videoType: 'video' | 'short';
  preVideoContent: {
    learningObjectives: string[];
    prerequisites: string[];
    keyTerms: { term: string; definition: string }[];
  };
  postVideoContent: {
    keyConcepts: string[];
    reflectionQuestions: string[];
    practicalApplications: string[];
    additionalResources: { title: string; url: string }[];
  };
}

const videoTypes = [
  {
    id: 'video',
    label: 'YouTube Video',
    icon: Video,
    description: 'Full-length educational video'
  },
  {
    id: 'short',
    label: 'YouTube Short',
    icon: Play,
    description: 'Short-form educational content'
  }
];

export default function NewMediaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [youtubePreview, setYoutubePreview] = useState<{id: string; thumbnail: string} | null>(null);

  const [formData, setFormData] = useState<MediaData>({
    topicId: '',
    title: '',
    description: '',
    difficulty: 'Beginner',
    xpReward: 50,
    estimatedMinutes: 5,
    order: 1,
    youtubeUrl: '',
    videoType: 'video',
    preVideoContent: {
      learningObjectives: [''],
      prerequisites: [''],
      keyTerms: [{ term: '', definition: '' }]
    },
    postVideoContent: {
      keyConcepts: [''],
      reflectionQuestions: [''],
      practicalApplications: [''],
      additionalResources: [{ title: '', url: '' }]
    }
  });

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
  }, [formData.topicId]);

  useEffect(() => {
    // Extract YouTube ID and generate preview
    if (formData.youtubeUrl) {
      const youtubeId = extractYouTubeId(formData.youtubeUrl);
      if (youtubeId) {
        setYoutubePreview({
          id: youtubeId,
          thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
        });
      } else {
        setYoutubePreview(null);
      }
    } else {
      setYoutubePreview(null);
    }
  }, [formData.youtubeUrl]);

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
      setSelectedSubject(subjectId);
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
        setSelectedSubject(topic.subjectId.toString());
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
      const response = await fetch(`/api/admin/media?topicId=${topicId}`);
      if (response.ok) {
        const data = await response.json();
        const nextOrder = (data.media?.length || 0) + 1;
        setFormData(prev => ({ ...prev, order: nextOrder }));
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    }
  };

  const addArrayItem = (section: 'preVideoContent' | 'postVideoContent', field: string, defaultValue: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section] as any)[field], defaultValue]
      }
    }));
  };

  const removeArrayItem = (section: 'preVideoContent' | 'postVideoContent', field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: (prev[section] as any)[field].filter((_: any, i: number) => i !== index)
      }
    }));
  };

  const updateArrayItem = (section: 'preVideoContent' | 'postVideoContent', field: string, index: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: (prev[section] as any)[field].map((item: any, i: number) => i === index ? value : item)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.topicId || !formData.title.trim() || !formData.description.trim() || !formData.youtubeUrl.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!extractYouTubeId(formData.youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create media');
      }

      router.push('/admin/media');
    } catch (err) {
      console.error('Error creating media:', err);
      setError(err instanceof Error ? err.message : 'Failed to create media');
    } finally {
      setIsLoading(false);
    }
  };

  const renderArraySection = (
    title: string,
    section: 'preVideoContent' | 'postVideoContent',
    field: string,
    placeholder: string,
    defaultValue: any
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{title}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addArrayItem(section, field, defaultValue)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>
      {(formData[section] as any)[field].map((item: any, index: number) => (
        <div key={index} className="flex gap-2">
          {typeof item === 'string' ? (
            <Input
              value={item}
              onChange={(e) => updateArrayItem(section, field, index, e.target.value)}
              placeholder={placeholder}
              className="flex-1"
            />
          ) : (
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Input
                value={item.term || item.title || ''}
                onChange={(e) => updateArrayItem(section, field, index, { ...item, [field === 'keyTerms' ? 'term' : 'title']: e.target.value })}
                placeholder={field === 'keyTerms' ? 'Term' : 'Title'}
              />
              <Input
                value={item.definition || item.url || ''}
                onChange={(e) => updateArrayItem(section, field, index, { ...item, [field === 'keyTerms' ? 'definition' : 'url']: e.target.value })}
                placeholder={field === 'keyTerms' ? 'Definition' : 'URL'}
              />
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeArrayItem(section, field, index)}
            disabled={(formData[section] as any)[field].length <= 1}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/media">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Media
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Media</h1>
          <p className="text-gray-600">Add educational YouTube videos and shorts</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Setup</CardTitle>
            <CardDescription>Choose where this media belongs and what type it should be</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={selectedSubject}
                  onValueChange={fetchTopicsForSubject}
                >
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
                <Label htmlFor="topic">Topic *</Label>
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
              <Label htmlFor="videoType">Video Type</Label>
              <Select
                value={formData.videoType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, videoType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {videoTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                {videoTypes.find(t => t.id === formData.videoType)?.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Media Content */}
        <Card>
          <CardHeader>
            <CardTitle>Media Content</CardTitle>
            <CardDescription>Configure the video content and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a descriptive title for your video..."
                required
              />
            </div>

            <RichTextEditor
              label="Description *"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Provide a detailed description of the video content and learning objectives..."
              required
            />

            <div>
              <Label htmlFor="youtubeUrl">YouTube URL *</Label>
              <Input
                id="youtubeUrl"
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                required
              />
              {youtubePreview && (
                <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Youtube className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">YouTube Video Detected</p>
                      <p className="text-xs text-gray-500">ID: {youtubePreview.id}</p>
                    </div>
                    <img
                      src={youtubePreview.thumbnail}
                      alt="Video thumbnail"
                      className="w-16 h-12 object-cover rounded"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
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
                <Label htmlFor="xpReward">XP Reward</Label>
                <Input
                  id="xpReward"
                  type="number"
                  min="1"
                  value={formData.xpReward}
                  onChange={(e) => setFormData(prev => ({ ...prev, xpReward: parseInt(e.target.value) || 50 }))}
                />
              </div>

              <div>
                <Label htmlFor="estimatedMinutes">Estimated Minutes</Label>
                <Input
                  id="estimatedMinutes"
                  type="number"
                  min="1"
                  value={formData.estimatedMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedMinutes: parseInt(e.target.value) || 5 }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pre-Video Content */}
        <Card>
          <CardHeader>
            <CardTitle>Pre-Video Content</CardTitle>
            <CardDescription>Content to show before the video to prepare students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderArraySection('Learning Objectives', 'preVideoContent', 'learningObjectives', 'What will students learn from this video?', '')}
            {renderArraySection('Prerequisites', 'preVideoContent', 'prerequisites', 'What should students know before watching?', '')}
            {renderArraySection('Key Terms', 'preVideoContent', 'keyTerms', 'Important terms in this video', { term: '', definition: '' })}
          </CardContent>
        </Card>

        {/* Post-Video Content */}
        <Card>
          <CardHeader>
            <CardTitle>Post-Video Content</CardTitle>
            <CardDescription>Content to reinforce learning after watching the video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderArraySection('Key Concepts', 'postVideoContent', 'keyConcepts', 'Main takeaways from the video', '')}
            {renderArraySection('Reflection Questions', 'postVideoContent', 'reflectionQuestions', 'Questions to help students reflect', '')}
            {renderArraySection('Practical Applications', 'postVideoContent', 'practicalApplications', 'How to apply this knowledge', '')}
            {renderArraySection('Additional Resources', 'postVideoContent', 'additionalResources', 'Related learning materials', { title: '', url: '' })}
          </CardContent>
        </Card>

        {/* Preview */}
        {(formData.title || formData.description) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {formData.videoType === 'video' ? <Video className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                Media Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50">
                <div className="text-xs font-medium text-indigo-600 mb-2">
                  {formData.videoType === 'video' ? 'YOUTUBE VIDEO' : 'YOUTUBE SHORT'}
                </div>
                <div className="font-medium text-gray-800 mb-2">
                  {formData.title || 'Enter title...'}
                </div>
                <div className="text-sm text-gray-600 mb-3" dangerouslySetInnerHTML={{
                  __html: formData.description || 'Enter description...'
                }} />
                <div className="flex items-center space-x-2">
                  <Badge className="text-xs">{formData.difficulty}</Badge>
                  <Badge variant="outline" className="text-xs">{formData.xpReward} XP</Badge>
                  <Badge variant="outline" className="text-xs">{formData.estimatedMinutes} min</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" asChild>
            <Link href="/admin/media">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              'Creating...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Media
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}