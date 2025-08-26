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
  CreditCard,
  Zap,
  BookOpen,
  Upload,
  Download,
  Tag,
  Clock
} from 'lucide-react';
import { ISubject, ITopic } from '@/models/database';
import { Types } from 'mongoose';

interface EnhancedFlashcard {
  _id: Types.ObjectId;
  topicId: Types.ObjectId;
  front: string;
  back: string;
  imageUrl?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  order: number;
  tags: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  topicName: string;
  subjectName: string;
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<EnhancedFlashcard[]>([]);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<EnhancedFlashcard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFlashcards();
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
    let filtered = flashcards;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(flashcard =>
        flashcard.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flashcard.back.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flashcard.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flashcard.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flashcard.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(flashcard => flashcard.subjectName === getSubjectName(selectedSubject));
    }

    // Filter by topic
    if (selectedTopic !== 'all') {
      filtered = filtered.filter(flashcard => flashcard.topicId.toString() === selectedTopic);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(flashcard => flashcard.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(flashcard => flashcard.difficulty === selectedDifficulty);
    }

    setFilteredFlashcards(filtered);
  }, [flashcards, searchTerm, selectedSubject, selectedTopic, selectedCategory, selectedDifficulty, subjects]);

  const fetchFlashcards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/flashcards');
      if (!response.ok) {
        throw new Error('Failed to fetch flashcards');
      }
      
      const data = await response.json();
      setFlashcards(data.flashcards || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load flashcards');
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

  const handleDelete = async (flashcardId: string) => {
    if (!confirm('Are you sure you want to delete this flashcard? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/flashcards/${flashcardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete flashcard');
      }

      // Refresh the list
      await fetchFlashcards();
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

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s._id.toString() === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getFlashcardStats = () => {
    return {
      total: flashcards.length,
      byDifficulty: {
        'Beginner': flashcards.filter(fc => fc.difficulty === 'Beginner').length,
        'Intermediate': flashcards.filter(fc => fc.difficulty === 'Intermediate').length,
        'Advanced': flashcards.filter(fc => fc.difficulty === 'Advanced').length,
      },
      totalPoints: flashcards.reduce((sum, fc) => sum + fc.points, 0),
      avgPoints: flashcards.length > 0 ? Math.round(flashcards.reduce((sum, fc) => sum + fc.points, 0) / flashcards.length) : 0,
      categories: categories.length,
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
            <p className="text-gray-600">Manage flashcards for spaced repetition learning</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
            <p className="text-gray-600">Manage flashcards for spaced repetition learning</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-2">⚠️ Error Loading Flashcards</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchFlashcards} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getFlashcardStats();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
          <p className="text-gray-600">Manage flashcards for spaced repetition learning</p>
        </div>
        <div className="flex space-x-2">
          {selectedTopic !== 'all' && (
            <Button asChild variant="outline">
              <Link href={`/admin/flashcards/new?topicId=${selectedTopic}`}>
                <Plus className="w-4 h-4 mr-2" />
                Add to Topic
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/admin/flashcards/bulk">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/flashcards/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Flashcard
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flashcards</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beginner Level</CardTitle>
            <div className="w-3 h-3 rounded bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byDifficulty.Beginner}</div>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Points</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPoints}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Flashcards</CardTitle>
              <CardDescription>
                {filteredFlashcards.length} of {flashcards.length} flashcards
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

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
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
                  placeholder="Search flashcards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFlashcards.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No flashcards found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedSubject !== 'all' || selectedTopic !== 'all' || selectedCategory !== 'all' || selectedDifficulty !== 'all'
                  ? 'Try adjusting your search or filters.' 
                  : 'Get started by creating a new flashcard.'}
              </p>
              {!searchTerm && selectedSubject === 'all' && selectedTopic === 'all' && selectedCategory === 'all' && selectedDifficulty === 'all' && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/admin/flashcards/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Flashcard
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Front</TableHead>
                  <TableHead>Back</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlashcards.map((flashcard) => (
                  <TableRow key={flashcard._id.toString()}>
                    <TableCell className="max-w-xs">
                      <div className="font-medium truncate" title={flashcard.front}>
                        {truncateText(flashcard.front)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-gray-600 truncate" title={flashcard.back}>
                        {truncateText(flashcard.back)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{flashcard.topicName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{flashcard.subjectName}</TableCell>
                    <TableCell>
                      {flashcard.category ? (
                        <Badge variant="outline">{flashcard.category}</Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">No category</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(flashcard.difficulty)}>
                        {flashcard.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {flashcard.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {flashcard.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{flashcard.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{flashcard.points}</TableCell>
                    <TableCell>{flashcard.order}</TableCell>
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
                            <Link href={`/admin/flashcards/${flashcard._id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/flashcards/${flashcard._id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(flashcard._id.toString())}
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