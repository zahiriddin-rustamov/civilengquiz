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
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Move,
  Users
} from 'lucide-react';
import { ISubject, ITopic, IMedia } from '@/models/database';
import { Types } from 'mongoose';

interface EnhancedMedia extends IMedia {
  topicName: string;
  subjectName: string;
  subjectId: Types.ObjectId;
}

interface MediaGroup {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  media: EnhancedMedia[];
  videoCount: number;
  shortCount: number;
  totalXP: number;
}

export default function MediaPage() {
  const [media, setMedia] = useState<EnhancedMedia[]>([]);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<EnhancedMedia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedVideoType, setSelectedVideoType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupedMedia, setGroupedMedia] = useState<MediaGroup[]>([]);

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

    // Filter by video type
    if (selectedVideoType !== 'all') {
      filtered = filtered.filter(mediaItem => mediaItem.videoType === selectedVideoType);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(mediaItem => mediaItem.difficulty === selectedDifficulty);
    }

    setFilteredMedia(filtered);

    // Group filtered media by subject-topic combination
    const groups = groupMediaByTopic(filtered);
    setGroupedMedia(groups);
  }, [media, searchTerm, selectedSubject, selectedTopic, selectedVideoType, selectedDifficulty, subjects]);

  const groupMediaByTopic = (mediaItems: EnhancedMedia[]): MediaGroup[] => {
    const groupMap = new Map<string, MediaGroup>();

    mediaItems.forEach(item => {
      const key = `${item.subjectId}-${item.topicId}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          subjectId: item.subjectId.toString(),
          subjectName: item.subjectName,
          topicId: item.topicId.toString(),
          topicName: item.topicName,
          media: [],
          videoCount: 0,
          shortCount: 0,
          totalXP: 0,
        });
      }

      const group = groupMap.get(key)!;
      group.media.push(item);
      group.totalXP += item.xpReward;

      if (item.videoType === 'video') {
        group.videoCount++;
      } else {
        group.shortCount++;
      }
    });

    // Sort groups by subject name, then topic name
    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.subjectName !== b.subjectName) {
        return a.subjectName.localeCompare(b.subjectName);
      }
      return a.topicName.localeCompare(b.topicName);
    });
  };

  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

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

  const getVideoTypeColor = (videoType: string) => {
    switch (videoType) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'short': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s._id.toString() === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getVideoPreview = (mediaItem: EnhancedMedia) => {
    return (
      <div className="flex items-center space-x-2">
        {getVideoTypeIcon(mediaItem.videoType)}
        <span className="text-sm">
          {mediaItem.duration ? `${Math.floor(mediaItem.duration / 60)}:${(mediaItem.duration % 60).toString().padStart(2, '0')}` : 'No duration'}
        </span>
      </div>
    );
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media</h1>
          <p className="text-gray-600">Manage educational YouTube videos and shorts</p>
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


      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Media</CardTitle>
              <CardDescription>
                {filteredMedia.length} of {media.length} YouTube videos
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

              {/* Video Type Filter */}
              <Select value={selectedVideoType} onValueChange={setSelectedVideoType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All video types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="video">YouTube Video</SelectItem>
                  <SelectItem value="short">YouTube Short</SelectItem>
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
                  placeholder="Search YouTube videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {groupedMedia.length === 0 ? (
            <div className="text-center py-8">
              <Play className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No media found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedSubject !== 'all' || selectedTopic !== 'all' || selectedVideoType !== 'all' || selectedDifficulty !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding YouTube videos.'}
              </p>
              {!searchTerm && selectedSubject === 'all' && selectedTopic === 'all' && selectedVideoType === 'all' && selectedDifficulty === 'all' && (
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
            <div className="space-y-4">
              {groupedMedia.map((group) => {
                const groupKey = `${group.subjectId}-${group.topicId}`;
                const isExpanded = expandedGroups.has(groupKey);

                return (
                  <div key={groupKey} className="border rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <div
                      className="bg-gray-50 border-b p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleGroupExpansion(groupKey)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            <div className="text-left">
                              <div className="font-semibold text-gray-900">
                                {group.subjectName} → {group.topicName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {group.videoCount} videos, {group.shortCount} shorts • {group.totalXP} XP total
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Group Actions */}
                        <div
                          className="flex items-center space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Group actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {group.videoCount > 0 && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/media/reorder?topicId=${group.topicId}`}>
                                    <Move className="w-4 h-4 mr-2" />
                                    Reorder Videos
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/media/new?topicId=${group.topicId}`}>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Media to Topic
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSubject(group.subjectId);
                                  setSelectedTopic(group.topicId);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Only This Topic
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-4">
                        <div className="space-y-3">
                          {group.media
                            .sort((a, b) => {
                              // Sort videos by order, then shorts after
                              if (a.videoType === 'video' && b.videoType === 'video') {
                                return a.order - b.order;
                              }
                              if (a.videoType === 'video') return -1;
                              if (b.videoType === 'video') return 1;
                              return 0;
                            })
                            .map((mediaItem) => (
                              <div key={mediaItem._id.toString()} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className="flex items-center space-x-2">
                                    {getVideoTypeIcon(mediaItem.videoType)}
                                    <Badge className={getVideoTypeColor(mediaItem.videoType)} variant="outline">
                                      {mediaItem.videoType === 'video' ? `#${mediaItem.order}` : 'Random'}
                                    </Badge>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate" title={mediaItem.title}>
                                      {mediaItem.title}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate" title={mediaItem.description}>
                                      {truncateText(mediaItem.description, 60)}
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Badge className={getDifficultyColor(mediaItem.difficulty)} variant="outline">
                                      {mediaItem.difficulty}
                                    </Badge>
                                    <span className="text-sm text-gray-600">{mediaItem.xpReward} XP</span>
                                    {getVideoPreview(mediaItem)}
                                  </div>
                                </div>

                                {/* Individual Media Actions */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                      <span className="sr-only">Media actions</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/admin/media/${mediaItem._id}`}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <a href={mediaItem.youtubeUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Open YouTube
                                      </a>
                                    </DropdownMenuItem>
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
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}