'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Play,
  Zap,
  BookOpen,
  Video,
  MonitorSpeaker,
  ImageIcon,
  Clock,
  ExternalLink
} from 'lucide-react';
import { ISubject, ITopic } from '@/models/database';
import { Types } from 'mongoose';

interface EnhancedMedia {
  _id: Types.ObjectId;
  topicId: Types.ObjectId;
  type: 'video' | 'simulation' | 'gallery';
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  order: number;
  data: any;
  createdAt: Date;
  updatedAt: Date;
  topicName: string;
  subjectName: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<EnhancedMedia[]>([]);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<EnhancedMedia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject !== 'all') {
      fetchTopicsForSubject(selectedSubject);
    } else {
      setTopics([]);
      setSelectedTopic('all');
    }
  }, [selectedSubject]);

  useEffect(() => {
    let filtered = media;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(mediaItem =>
        mediaItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mediaItem.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mediaItem.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mediaItem.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(mediaItem => mediaItem.subjectName === getSubjectName(selectedSubject));
    }

    // Filter by topic
    if (selectedTopic !== 'all') {
      filtered = filtered.filter(mediaItem => mediaItem.topicId.toString() === selectedTopic);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(mediaItem => mediaItem.type === selectedType);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(mediaItem => mediaItem.difficulty === selectedDifficulty);
    }

    setFilteredMedia(filtered);
  }, [media, searchTerm, selectedSubject, selectedTopic, selectedType, selectedDifficulty, subjects]);

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/media');
      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }
      
      const data = await response.json();
      setMedia(data.media || []);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setIsLoading(false);
    }
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
      const response = await fetch(`/api/subjects/${subjectId}/topics`);
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const handleDelete = async (mediaId: string) => {
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

      // Refresh the list
      await fetchMedia();
    } catch (err) {
      console.error('Error deleting media:', err);
      alert('Failed to delete media. Please try again.');
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'simulation': return 'bg-blue-100 text-blue-800';
      case 'gallery': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'simulation': return <MonitorSpeaker className="w-4 h-4" />;
      case 'gallery': return <ImageIcon className="w-4 h-4" />;
      default: return <Play className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Video';
      case 'simulation': return 'Simulation';
      case 'gallery': return 'Gallery';
      default: return type;
    }
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s._id.toString() === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getMediaPreview = (mediaItem: EnhancedMedia) => {
    switch (mediaItem.type) {
      case 'video':
        return (
          <div className="flex items-center space-x-2">
            <Video className="w-4 h-4 text-red-500" />
            <span className="text-sm">
              {mediaItem.data.duration ? `${Math.floor(mediaItem.data.duration / 60)}:${(mediaItem.data.duration % 60).toString().padStart(2, '0')}` : 'Video'}
            </span>
          </div>
        );
      case 'simulation':
        return (
          <div className="flex items-center space-x-2">
            <MonitorSpeaker className="w-4 h-4 text-blue-500" />
            <span className="text-sm">Interactive</span>
          </div>
        );
      case 'gallery':
        return (
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-purple-500" />
            <span className="text-sm">{mediaItem.data.images?.length || 0} images</span>
          </div>
        );
      default:
        return <span className="text-sm text-gray-500">Unknown</span>;
    }
  };

  const getMediaStats = () => {
    return {
      total: media.length,
      byType: {
        'video': media.filter(m => m.type === 'video').length,
        'simulation': media.filter(m => m.type === 'simulation').length,
        'gallery': media.filter(m => m.type === 'gallery').length,
      },
      byDifficulty: {
        'Beginner': media.filter(m => m.difficulty === 'Beginner').length,
        'Intermediate': media.filter(m => m.difficulty === 'Intermediate').length,
        'Advanced': media.filter(m => m.difficulty === 'Advanced').length,
      },
      totalPoints: media.reduce((sum, m) => sum + m.points, 0),
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media</h1>
            <p className="text-gray-600">Manage videos, simulations, and image galleries</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-64 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media</h1>
            <p className="text-gray-600">Manage videos, simulations, and image galleries</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-2">⚠️ Error Loading Media</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchMedia} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getMediaStats();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media</h1>
          <p className="text-gray-600">Manage videos, simulations, and image galleries</p>
        </div>
        <div className="flex space-x-2">
          {selectedTopic !== 'all' && (
            <Button asChild variant="outline">
              <Link href={`/admin/media/new?topicId=${selectedTopic}`}>
                <Plus className="w-4 h-4 mr-2" />
                Add to Topic
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/admin/media/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Media
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Media</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <Video className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.video}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simulations</CardTitle>
            <MonitorSpeaker className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.simulation}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Galleries</CardTitle>
            <ImageIcon className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.gallery}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Media</CardTitle>
              <CardDescription>
                {filteredMedia.length} of {media.length} media items
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Subject Filter */}
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject._id.toString()} value={subject._id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Topic Filter */}
              <Select value={selectedTopic} onValueChange={setSelectedTopic} disabled={selectedSubject === 'all'}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  {topics.map(topic => (
                    <SelectItem key={topic._id.toString()} value={topic._id.toString()}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="simulation">Simulation</SelectItem>
                  <SelectItem value="gallery">Gallery</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Difficulty Filter */}
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search media..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMedia.length === 0 ? (
            <div className="text-center py-8">
              <Play className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No media found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedSubject !== 'all' || selectedTopic !== 'all' || selectedType !== 'all' || selectedDifficulty !== 'all'
                  ? 'Try adjusting your search or filters.' 
                  : 'Get started by adding media content.'}
              </p>
              {!searchTerm && selectedSubject === 'all' && selectedTopic === 'all' && selectedType === 'all' && selectedDifficulty === 'all' && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/admin/media/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Media
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedia.map((mediaItem) => (
                  <TableRow key={mediaItem._id.toString()}>
                    <TableCell className="max-w-xs">
                      <div className="font-medium truncate" title={mediaItem.title}>
                        {truncateText(mediaItem.title)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-gray-600 truncate" title={mediaItem.description}>
                        {truncateText(mediaItem.description)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{mediaItem.topicName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{mediaItem.subjectName}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(mediaItem.type)}>
                        <div className="flex items-center space-x-1">
                          {getTypeIcon(mediaItem.type)}
                          <span>{getTypeLabel(mediaItem.type)}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>{getMediaPreview(mediaItem)}</TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(mediaItem.difficulty)}>
                        {mediaItem.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>{mediaItem.points}</TableCell>
                    <TableCell>{mediaItem.order}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/media/${mediaItem._id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          {mediaItem.data.url && (
                            <DropdownMenuItem asChild>
                              <a href={mediaItem.data.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open URL
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/media/${mediaItem._id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(mediaItem._id.toString())}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}