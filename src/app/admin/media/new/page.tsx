'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, X, Save, AlertCircle, Play, Video, MonitorSpeaker, ImageIcon, Trash2 } from 'lucide-react';
import { ISubject, ITopic } from '@/models/database';

interface MediaData {
  topicId: string;
  type: 'video' | 'simulation' | 'gallery';
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  order: number;
  data: any;
}

interface GalleryImage {
  url: string;
  caption: string;
  alt?: string;
}

export default function NewMediaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<MediaData>({
    topicId: '',
    type: 'video',
    title: '',
    description: '',
    difficulty: 'Beginner',
    points: 10,
    order: 1,
    data: {}
  });

  // Type-specific data states
  const [videoData, setVideoData] = useState({
    url: '',
    duration: 0,
    thumbnail: '',
    captions: '',
    quality: '720p'
  });

  const [simulationData, setSimulationData] = useState({
    url: '',
    width: 800,
    height: 600,
    parameters: {} as Record<string, any>,
    instructions: ''
  });

  const [galleryData, setGalleryData] = useState({
    images: [{ url: '', caption: '', alt: '' }] as GalleryImage[]
  });

  const [parameterKey, setParameterKey] = useState('');
  const [parameterValue, setParameterValue] = useState('');

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
  }, [formData.topicId, topics]);

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

  const addGalleryImage = () => {
    setGalleryData(prev => ({
      images: [...prev.images, { url: '', caption: '', alt: '' }]
    }));
  };

  const removeGalleryImage = (index: number) => {
    setGalleryData(prev => ({
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateGalleryImage = (index: number, field: keyof GalleryImage, value: string) => {
    setGalleryData(prev => {
      const updated = [...prev.images];
      updated[index] = { ...updated[index], [field]: value };
      return { images: updated };
    });
  };

  const addSimulationParameter = () => {
    if (parameterKey.trim() && parameterValue.trim()) {
      setSimulationData(prev => ({
        ...prev,
        parameters: {
          ...prev.parameters,
          [parameterKey.trim()]: parameterValue.trim()
        }
      }));
      setParameterKey('');
      setParameterValue('');
    }
  };

  const removeSimulationParameter = (key: string) => {
    setSimulationData(prev => {
      const updated = { ...prev.parameters };
      delete updated[key];
      return { ...prev, parameters: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topicId || !formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // Prepare media data based on type
    let mediaData = { ...formData };
    switch (formData.type) {
      case 'video':
        if (!videoData.url.trim()) {
          setError('Video URL is required');
          return;
        }
        mediaData.data = videoData;
        break;
      case 'simulation':
        if (!simulationData.url.trim()) {
          setError('Simulation URL is required');
          return;
        }
        mediaData.data = simulationData;
        break;
      case 'gallery':
        const validImages = galleryData.images.filter(img => img.url.trim() && img.caption.trim());
        if (validImages.length === 0) {
          setError('At least one image with URL and caption is required');
          return;
        }
        mediaData.data = { images: validImages };
        break;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaData),
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

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="videoUrl">Video URL *</Label>
              <Input
                id="videoUrl"
                type="url"
                value={videoData.url}
                onChange={(e) => setVideoData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={videoData.duration}
                  onChange={(e) => setVideoData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="quality">Quality</Label>
                <Select 
                  value={videoData.quality} 
                  onValueChange={(value) => setVideoData(prev => ({ ...prev, quality: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                    <SelectItem value="4K">4K</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="thumbnail">Thumbnail URL (optional)</Label>
              <Input
                id="thumbnail"
                type="url"
                value={videoData.thumbnail}
                onChange={(e) => setVideoData(prev => ({ ...prev, thumbnail: e.target.value }))}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>

            <div>
              <Label htmlFor="captions">Captions URL (optional)</Label>
              <Input
                id="captions"
                type="url"
                value={videoData.captions}
                onChange={(e) => setVideoData(prev => ({ ...prev, captions: e.target.value }))}
                placeholder="https://example.com/captions.vtt"
              />
            </div>
          </div>
        );

      case 'simulation':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="simulationUrl">Simulation URL *</Label>
              <Input
                id="simulationUrl"
                type="url"
                value={simulationData.url}
                onChange={(e) => setSimulationData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://phet.colorado.edu/sims/... or embedded iframe URL"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Width (px)</Label>
                <Input
                  id="width"
                  type="number"
                  min="300"
                  value={simulationData.width}
                  onChange={(e) => setSimulationData(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                />
              </div>
              <div>
                <Label htmlFor="height">Height (px)</Label>
                <Input
                  id="height"
                  type="number"
                  min="200"
                  value={simulationData.height}
                  onChange={(e) => setSimulationData(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
                />
              </div>
            </div>

            <div>
              <Label>Simulation Parameters</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={parameterKey}
                    onChange={(e) => setParameterKey(e.target.value)}
                    placeholder="Parameter name"
                    className="flex-1"
                  />
                  <Input
                    value={parameterValue}
                    onChange={(e) => setParameterValue(e.target.value)}
                    placeholder="Parameter value"
                    className="flex-1"
                  />
                  <Button type="button" onClick={addSimulationParameter} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {Object.entries(simulationData.parameters).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(simulationData.parameters).map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="flex items-center gap-1">
                        {key}: {value}
                        <button
                          type="button"
                          onClick={() => removeSimulationParameter(key)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Usage Instructions</Label>
              <Textarea
                id="instructions"
                value={simulationData.instructions}
                onChange={(e) => setSimulationData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Instructions for using the simulation..."
                rows={3}
              />
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-4">
            <Label>Gallery Images</Label>
            {galleryData.images.map((image, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Image {index + 1}</Label>
                      {galleryData.images.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGalleryImage(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label>Image URL *</Label>
                      <Input
                        value={image.url}
                        onChange={(e) => updateGalleryImage(index, 'url', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        type="url"
                      />
                    </div>
                    <div>
                      <Label>Caption *</Label>
                      <Input
                        value={image.caption}
                        onChange={(e) => updateGalleryImage(index, 'caption', e.target.value)}
                        placeholder="Description of the image"
                      />
                    </div>
                    <div>
                      <Label>Alt Text (optional)</Label>
                      <Input
                        value={image.alt}
                        onChange={(e) => updateGalleryImage(index, 'alt', e.target.value)}
                        placeholder="Accessibility description"
                      />
                    </div>
                    {image.url && (
                      <div>
                        <img 
                          src={image.url} 
                          alt={image.alt || image.caption} 
                          className="max-w-xs h-32 object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button type="button" onClick={addGalleryImage} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Image
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const getPreviewIcon = () => {
    switch (formData.type) {
      case 'video': return <Video className="w-8 h-8" />;
      case 'simulation': return <MonitorSpeaker className="w-8 h-8" />;
      case 'gallery': return <ImageIcon className="w-8 h-8" />;
      default: return <Play className="w-8 h-8" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/media">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Media
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Media</h1>
          <p className="text-gray-600">Add videos, simulations, or image galleries</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Configure the fundamental properties of your media content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select onValueChange={(value) => fetchTopicsForSubject(value)}>
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
                    <Label htmlFor="topic">Topic</Label>
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
                  <Label htmlFor="type">Media Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="simulation">Interactive Simulation</SelectItem>
                      <SelectItem value="gallery">Image Gallery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a descriptive title for your media content..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a detailed description of the content and learning objectives..."
                    rows={3}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Configuration</CardTitle>
                <CardDescription>Configure the specific properties for your {formData.type} content</CardDescription>
              </CardHeader>
              <CardContent>
                {renderTypeSpecificFields()}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Media Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label htmlFor="points">XP Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getPreviewIcon()}
                  Media Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.title || formData.description ? (
                  <div className="p-4 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50">
                    <div className="text-xs font-medium text-indigo-600 mb-2">
                      {formData.type.toUpperCase()}
                    </div>
                    <div className="font-medium text-gray-800 mb-2">
                      {formData.title || 'Enter title...'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formData.description || 'Enter description...'}
                    </div>
                    <div className="mt-3 flex items-center space-x-2">
                      <Badge className="text-xs">{formData.difficulty}</Badge>
                      <Badge variant="outline" className="text-xs">{formData.points} XP</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    {getPreviewIcon()}
                    <p className="text-sm mt-2">Enter content to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

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