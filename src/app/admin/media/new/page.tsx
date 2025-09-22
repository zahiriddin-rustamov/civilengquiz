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
import { SettingsSection } from '@/components/admin/SettingsSection';
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
  preVideoContent?: {
    learningObjectives: string[];
    prerequisites: string[];
    keyTerms: { term: string; definition: string }[];
  };
  postVideoContent?: {
    keyConcepts: string[];
    reflectionQuestions: string[];
    practicalApplications: string[];
    additionalResources: { title: string; url: string }[];
  };
  quizQuestions?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
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
    },
    quizQuestions: []
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

    // Validate quiz questions for shorts
    if (formData.videoType === 'short' && formData.quizQuestions) {
      const hasValidQuiz = formData.quizQuestions.some(q =>
        q.question.trim() &&
        q.options.every(o => o.trim()) &&
        q.explanation.trim()
      );
      if (formData.quizQuestions.length > 0 && !hasValidQuiz) {
        setError('Please complete at least one quiz question with all fields filled');
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare data based on video type
      const submitData: any = {
        topicId: formData.topicId,
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        xpReward: formData.xpReward,
        estimatedMinutes: formData.estimatedMinutes,
        order: formData.order,
        youtubeUrl: formData.youtubeUrl,
        videoType: formData.videoType
      };

      // Add appropriate content based on type
      if (formData.videoType === 'video') {
        submitData.preVideoContent = formData.preVideoContent;
        submitData.postVideoContent = formData.postVideoContent;
      } else if (formData.videoType === 'short') {
        // Filter out empty quiz questions
        const validQuizQuestions = (formData.quizQuestions || []).filter(q =>
          q.question.trim() && q.options.every(o => o.trim())
        );
        if (validQuizQuestions.length > 0) {
          submitData.quizQuestions = validQuizQuestions;
        }
      }

      const response = await fetch('/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
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
              <div className="flex gap-2 mt-2">
                {videoTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      const isShort = type.id === 'short';
                      setFormData(prev => ({
                        ...prev,
                        videoType: type.id as any,
                        // Adjust defaults based on type
                        estimatedMinutes: isShort ? 1 : 5,
                        xpReward: isShort ? 25 : 50,
                        // Initialize appropriate content structures
                        preVideoContent: isShort ? undefined : (prev.preVideoContent || {
                          learningObjectives: [''],
                          prerequisites: [''],
                          keyTerms: [{ term: '', definition: '' }]
                        }),
                        postVideoContent: isShort ? undefined : (prev.postVideoContent || {
                          keyConcepts: [''],
                          reflectionQuestions: [''],
                          practicalApplications: [''],
                          additionalResources: [{ title: '', url: '' }]
                        }),
                        quizQuestions: isShort ? (prev.quizQuestions || [{
                          question: '',
                          options: ['', '', '', ''],
                          correctAnswer: 0,
                          explanation: ''
                        }]) : undefined
                      }));
                    }}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-md border transition-all
                      ${formData.videoType === type.id
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <type.icon className="w-4 h-4" />
                    <span className="text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {videoTypes.find(t => t.id === formData.videoType)?.description}
                {formData.videoType === 'short' && ' (Typically under 60 seconds with quiz questions)'}
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
          </CardContent>
        </Card>

        {/* Pre-Video Content - Only for Long Videos */}
        {formData.videoType === 'video' && (
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
        )}

        {/* Post-Video Content - Only for Long Videos */}
        {formData.videoType === 'video' && (
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
        )}

        {/* Quiz Questions - Only for Shorts */}
        {formData.videoType === 'short' && (
          <Card>
            <CardHeader>
              <CardTitle>Quiz Questions</CardTitle>
              <CardDescription>Mini-quiz questions to test understanding after watching the short</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(formData.quizQuestions || []).map((quiz, qIndex) => (
                <div key={qIndex} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <Label className="text-sm font-medium">Question {qIndex + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        quizQuestions: prev.quizQuestions?.filter((_, i) => i !== qIndex)
                      }))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <Input
                    value={quiz.question}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      quizQuestions: prev.quizQuestions?.map((q, i) =>
                        i === qIndex ? { ...q, question: e.target.value } : q
                      )
                    }))}
                    placeholder="Enter the quiz question..."
                  />

                  <div className="space-y-2">
                    <Label className="text-xs">Answer Options</Label>
                    {quiz.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={quiz.correctAnswer === oIndex}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            quizQuestions: prev.quizQuestions?.map((q, i) =>
                              i === qIndex ? { ...q, correctAnswer: oIndex } : q
                            )
                          }))}
                        />
                        <Input
                          value={option}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            quizQuestions: prev.quizQuestions?.map((q, i) =>
                              i === qIndex ? {
                                ...q,
                                options: q.options.map((o, j) => j === oIndex ? e.target.value : o)
                              } : q
                            )
                          }))}
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label className="text-xs">Explanation (shown after answer)</Label>
                    <Input
                      value={quiz.explanation}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        quizQuestions: prev.quizQuestions?.map((q, i) =>
                          i === qIndex ? { ...q, explanation: e.target.value } : q
                        )
                      }))}
                      placeholder="Explain why this is the correct answer..."
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  quizQuestions: [...(prev.quizQuestions || []), {
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    explanation: ''
                  }]
                }))}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Quiz Question
              </Button>
            </CardContent>
          </Card>
        )}

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

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure difficulty, XP reward, and time estimate
              {formData.videoType === 'short' && ' (Shorts are typically under 60 seconds)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsSection
              difficulty={formData.difficulty}
              xpReward={formData.xpReward}
              estimatedMinutes={formData.estimatedMinutes}
              onDifficultyChange={(difficulty) => setFormData(prev => ({ ...prev, difficulty }))}
              onXpRewardChange={(xpReward) => setFormData(prev => ({ ...prev, xpReward }))}
              onEstimatedMinutesChange={(estimatedMinutes) => setFormData(prev => ({ ...prev, estimatedMinutes }))}
            />
            {formData.videoType === 'short' && formData.estimatedMinutes > 2 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                ⚠️ Shorts are typically under 60 seconds. Consider reducing the estimated time.
              </div>
            )}
          </CardContent>
        </Card>

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