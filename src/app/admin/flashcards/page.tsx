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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Clock,
  Copy,
  Filter,
  ChevronDown,
  ChevronRight,
  Move
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
  xpReward: number;
  estimatedMinutes: number;
  order: number;
  tags: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  topicName: string;
  subjectName: string;
}

interface FlashcardGroup {
  subjectName: string;
  topicId: string;
  topicName: string;
  flashcards: EnhancedFlashcard[];
  totalFlashcards: number;
  totalXP: number;
  categoryBreakdown: { [key: string]: number };
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<EnhancedFlashcard[]>([]);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [allTopicCombinations, setAllTopicCombinations] = useState<any[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<EnhancedFlashcard[]>([]);
  const [groupedFlashcards, setGroupedFlashcards] = useState<FlashcardGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    // Group filtered flashcards by subject-topic combination
    const groups = groupFlashcardsByTopic(filteredFlashcards, allTopicCombinations);
    setGroupedFlashcards(groups);
  }, [filteredFlashcards, allTopicCombinations, subjects]);

  const fetchFlashcards = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/flashcards?includeAllTopics=true');
      if (!response.ok) {
        throw new Error('Failed to fetch flashcards');
      }

      const data = await response.json();
      setFlashcards(data.flashcards || []);
      setCategories(data.categories || []);
      setAllTopicCombinations(data.allTopicCombinations || []);
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

  const handleExport = (format: 'csv' | 'json') => {
    const dataToExport = filteredFlashcards.map(fc => ({
      front: fc.front,
      back: fc.back,
      difficulty: fc.difficulty,
      xpReward: fc.xpReward,
      estimatedMinutes: fc.estimatedMinutes,
      tags: fc.tags.join(';'),
      category: fc.category || '',
      topicName: fc.topicName,
      subjectName: fc.subjectName,
      order: fc.order
    }));

    if (format === 'csv') {
      const headers = ['Front', 'Back', 'Difficulty', 'XP Reward', 'Est. Minutes', 'Tags', 'Category', 'Topic', 'Subject', 'Order'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => [
          `"${row.front.replace(/"/g, '""')}"`,
          `"${row.back.replace(/"/g, '""')}"`,
          row.difficulty,
          row.xpReward,
          row.estimatedMinutes,
          `"${row.tags}"`,
          `"${row.category}"`,
          `"${row.topicName}"`,
          `"${row.subjectName}"`,
          row.order
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flashcards_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      const jsonContent = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flashcards_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
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

  const groupFlashcardsByTopic = (flashcardItems: EnhancedFlashcard[], allTopics: any[] = []): FlashcardGroup[] => {
    const groupMap = new Map<string, FlashcardGroup>();

    // First, create groups from all available topics (including empty ones)
    allTopics.forEach(topic => {
      if (!topic._id || !topic.name || !topic.subjectName) {
        return;
      }

      const topicKey = `${topic.subjectName}-${topic._id.toString()}`;
      if (!groupMap.has(topicKey)) {
        groupMap.set(topicKey, {
          subjectName: topic.subjectName,
          topicId: topic._id.toString(),
          topicName: topic.name,
          flashcards: [],
          totalFlashcards: 0,
          totalXP: 0,
          categoryBreakdown: {},
        });
      }
    });

    // Then, populate with existing flashcards
    flashcardItems.forEach(item => {
      // Handle missing properties safely
      if (!item.topicId || !item.topicName || !item.subjectName) {
        console.warn('Flashcard missing required properties:', item);
        return;
      }

      const key = `${item.subjectName}-${item.topicId.toString()}`;

      // Create topic group if it doesn't exist (fallback for flashcards without matching allTopics)
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          subjectName: item.subjectName,
          topicId: item.topicId.toString(),
          topicName: item.topicName,
          flashcards: [],
          totalFlashcards: 0,
          totalXP: 0,
          categoryBreakdown: {},
        });
      }

      const group = groupMap.get(key)!;
      group.flashcards.push(item);
      group.totalFlashcards++;
      group.totalXP += item.xpReward || 0;

      // Count categories
      if (item.category) {
        group.categoryBreakdown[item.category] = (group.categoryBreakdown[item.category] || 0) + 1;
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
          <p className="text-gray-600">Manage flashcards for spaced repetition learning</p>
        </div>
        <div className="flex space-x-2">
          {groupedFlashcards.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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


      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Flashcards</CardTitle>
              <CardDescription>
                {filteredFlashcards.length} of {flashcards.length} flashcards • {groupedFlashcards.length} topic groups
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Subject Filter */}
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-36">
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
                <SelectTrigger className="w-36">
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
          {groupedFlashcards.length === 0 ? (
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
            <div className="space-y-4">
              {groupedFlashcards.map((group) => {
                const groupKey = `${group.subjectName}-${group.topicId}`;
                const isExpanded = expandedGroups.has(groupKey);
                const hasFlashcards = group.totalFlashcards > 0;

                return (
                  <div key={groupKey} className="border rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <div
                      className={`bg-gray-50 border-b p-4 transition-colors ${
                        hasFlashcards
                          ? 'cursor-pointer hover:bg-gray-100'
                          : 'cursor-default'
                      }`}
                      onClick={() => hasFlashcards && toggleGroupExpansion(groupKey)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {hasFlashcards ? (
                              isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
                            ) : (
                              <div className="w-5 h-5 flex items-center justify-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              </div>
                            )}
                            <div className="text-left">
                              <div className="font-semibold text-gray-900">
                                {group.subjectName} → {group.topicName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {group.totalFlashcards} flashcards • {group.totalXP} XP total
                                {Object.keys(group.categoryBreakdown).length > 0 && (
                                  <span className="ml-2">
                                    ({Object.entries(group.categoryBreakdown).map(([category, count]) => `${count} ${category}`).join(', ')})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Group Actions */}
                        <div
                          className="flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TooltipProvider>
                            <div className="flex items-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/admin/flashcards/bulk?topicId=${group.topicId}`}>
                                      <Upload className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Bulk import to topic</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/admin/flashcards/new?topicId=${group.topicId}`}>
                                      <Plus className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Add flashcard to topic</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Find the subject ID by name
                                      const subject = subjects.find(s => s.name === group.subjectName);
                                      if (subject) {
                                        setSelectedSubject(subject._id.toString());
                                        setSelectedTopic(group.topicId);
                                      }
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View only this topic</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && hasFlashcards && (
                      <div className="p-4">
                        <div className="space-y-3">
                          {group.flashcards
                            .sort((a, b) => a.order - b.order)
                            .map((flashcard) => (
                              <div key={flashcard._id.toString()} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      #{flashcard.order}
                                    </Badge>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <div className="font-medium text-gray-900 text-sm mb-1">Front</div>
                                        <div className="text-sm text-gray-700 truncate" title={flashcard.front}>
                                          {truncateText(flashcard.front, 40)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-900 text-sm mb-1">Back</div>
                                        <div className="text-sm text-gray-600 truncate" title={flashcard.back}>
                                          {truncateText(flashcard.back, 40)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2">
                                      {flashcard.category && (
                                        <Badge variant="secondary" className="text-xs">
                                          {flashcard.category}
                                        </Badge>
                                      )}
                                      {flashcard.tags.slice(0, 2).map((tag, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {flashcard.tags.length > 2 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{flashcard.tags.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-3">
                                    <Badge className={getDifficultyColor(flashcard.difficulty)} variant="outline">
                                      {flashcard.difficulty}
                                    </Badge>
                                    <div className="flex items-center space-x-1">
                                      <Zap className="w-3 h-3 text-yellow-500" />
                                      <span className="text-sm">{flashcard.xpReward} XP</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3 text-gray-500" />
                                      <span className="text-sm">{flashcard.estimatedMinutes}m</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Separator and Individual Flashcard Actions */}
                                <div className="flex items-center">
                                  <div className="w-px h-6 bg-gray-200 mx-3"></div>
                                  <TooltipProvider>
                                    <div className="flex items-center">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/flashcards/${flashcard._id}`}>
                                              <Eye className="h-4 w-4" />
                                            </Link>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>View flashcard</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/flashcards/${flashcard._id}/edit`}>
                                              <Edit className="h-4 w-4" />
                                            </Link>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Edit flashcard</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/flashcards/new?duplicate=${flashcard._id}`}>
                                              <Copy className="h-4 w-4" />
                                            </Link>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Duplicate flashcard</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(flashcard._id.toString())}
                                            className="text-red-600 hover:text-red-600 hover:bg-red-50"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Delete flashcard</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </TooltipProvider>
                                </div>
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