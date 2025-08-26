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
  FileText,
  Clock,
  Zap,
  BookOpen,
  CreditCard,
  Play
} from 'lucide-react';
import { ITopic, ISubject } from '@/models/database';
import { Types } from 'mongoose';

interface EnhancedTopic {
  _id: Types.ObjectId;
  name: string;
  description: string;
  longDescription?: string;
  subjectId: Types.ObjectId | { _id: Types.ObjectId; name: string };
  order: number;
  isUnlocked: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
  subjectName: string;
  contentCounts: {
    questions: number;
    flashcards: number;
    media: number;
  };
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<EnhancedTopic[]>([]);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<EnhancedTopic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopics();
    fetchSubjects();
  }, []);

  useEffect(() => {
    let filtered = topics;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(topic =>
        topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(topic => getSubjectId(topic) === selectedSubject);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(topic => topic.difficulty === selectedDifficulty);
    }

    setFilteredTopics(filtered);
  }, [topics, searchTerm, selectedSubject, selectedDifficulty]);

  const fetchTopics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/topics');
      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }
      
      const data = await response.json();
      setTopics(data);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load topics');
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

  const handleDelete = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic? This will also delete all associated questions, flashcards, and media.')) {
      return;
    }

    try {
      const response = await fetch(`/api/topics/${topicId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete topic');
      }

      // Refresh the list
      await fetchTopics();
    } catch (err) {
      console.error('Error deleting topic:', err);
      alert('Failed to delete topic. Please try again.');
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

  const getTotalContent = (topic: EnhancedTopic) => {
    return topic.contentCounts.questions + topic.contentCounts.flashcards + topic.contentCounts.media;
  };

  const getSubjectId = (topic: EnhancedTopic): string => {
    return typeof topic.subjectId === 'object' && topic.subjectId._id 
      ? topic.subjectId._id.toString() 
      : topic.subjectId.toString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Topics</h1>
            <p className="text-gray-600">Manage learning topics within subjects</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Topics</h1>
            <p className="text-gray-600">Manage learning topics within subjects</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-2">⚠️ Error Loading Topics</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchTopics} variant="outline">
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
          <h1 className="text-3xl font-bold text-gray-900">Topics</h1>
          <p className="text-gray-600">Manage learning topics within subjects</p>
        </div>
        <Button asChild>
          <Link href="/admin/topics/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Topic
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topics.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topics.filter(t => t.isUnlocked).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Minutes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topics.reduce((sum, t) => sum + t.estimatedMinutes, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topics.reduce((sum, t) => sum + t.xpReward, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Topics</CardTitle>
              <CardDescription>
                {filteredTopics.length} of {topics.length} topics
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
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTopics.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No topics found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedSubject !== 'all' || selectedDifficulty !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'Get started by creating a new topic.'}
              </p>
              {!searchTerm && selectedSubject === 'all' && selectedDifficulty === 'all' && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/admin/topics/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Topic
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Minutes</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTopics.map((topic) => (
                  <TableRow key={topic._id.toString()}>
                    <TableCell className="font-medium">{topic.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{topic.subjectName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={topic.description}>
                        {topic.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(topic.difficulty)}>
                        {topic.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {getTotalContent(topic)} items
                      </div>
                    </TableCell>
                    <TableCell>{topic.estimatedMinutes}m</TableCell>
                    <TableCell>{topic.xpReward}</TableCell>
                    <TableCell>
                      <Badge variant={topic.isUnlocked ? "default" : "secondary"}>
                        {topic.isUnlocked ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
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
                            <Link href={`/subjects/${getSubjectId(topic)}/topics/${topic._id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/topics/${topic._id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/questions?topicId=${topic._id}`}>
                              <FileText className="w-4 h-4 mr-2" />
                              Manage Questions ({topic.contentCounts.questions})
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/flashcards?topicId=${topic._id}`}>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Manage Flashcards ({topic.contentCounts.flashcards})
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/media?topicId=${topic._id}`}>
                              <Play className="w-4 h-4 mr-2" />
                              Manage Media ({topic.contentCounts.media})
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(topic._id.toString())}
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