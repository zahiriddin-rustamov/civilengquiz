'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Users,
  BookOpen,
  Clock,
  FileText,
  CreditCard,
  Play,
  ArrowUpDown,
  Lock
} from 'lucide-react';
import { ISubject } from '@/models/database';

interface EnhancedSubject extends ISubject {
  topicCount: number;
  questionCount: number;
  flashcardCount: number;
  mediaCount: number;
  totalContent: number;
  prerequisiteId?: {
    _id: string;
    name: string;
  };
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<EnhancedSubject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<EnhancedSubject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = subjects.filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects(subjects);
    }
  }, [subjects, searchTerm]);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/subjects/enhanced');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }

      const data = await response.json();
      setSubjects(data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject? This will also delete all associated topics, questions, flashcards, and media.')) {
      return;
    }

    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete subject');
      }

      // Refresh the list
      await fetchSubjects();
    } catch (err) {
      console.error('Error deleting subject:', err);
      alert('Failed to delete subject. Please try again.');
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
            <p className="text-gray-600">Manage learning subjects and courses</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
            <p className="text-gray-600">Manage learning subjects and courses</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-2">⚠️ Error Loading Subjects</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchSubjects} variant="outline">
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
          <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-600">Manage learning subjects and courses</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/admin/subjects/reorder">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Reorder
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/subjects/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Subjects</CardTitle>
              <CardDescription>
                {filteredSubjects.length} of {subjects.length} subjects
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubjects.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new subject.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/admin/subjects/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subject
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
                  <TableHead>Description</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Prerequisite</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject) => (
                  <TableRow
                    key={subject._id.toString()}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span className="hover:text-blue-600 transition-colors duration-200">
                          {subject.name}
                        </span>
                        {subject.totalContent === 0 && (
                          <div className="relative group">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                              <div className="bg-red-600 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                No content added yet
                              </div>
                            </div>
                          </div>
                        )}
                        {subject.prerequisiteId && (
                          <div className="relative group">
                            <Lock className="w-4 h-4 text-amber-500" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                              <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                Requires: {subject.prerequisiteId.name}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={subject.description}>
                        {subject.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-3 text-sm">
                          <span className="flex items-center space-x-1 hover:bg-blue-50 px-1 py-0.5 rounded transition-colors duration-200">
                            <BookOpen className="w-3 h-3 text-blue-500" />
                            <span className="font-medium">{subject.topicCount}</span>
                          </span>
                          <span className="flex items-center space-x-1 hover:bg-green-50 px-1 py-0.5 rounded transition-colors duration-200">
                            <FileText className="w-3 h-3 text-green-500" />
                            <span className="font-medium">{subject.questionCount}</span>
                          </span>
                          <span className="flex items-center space-x-1 hover:bg-purple-50 px-1 py-0.5 rounded transition-colors duration-200">
                            <CreditCard className="w-3 h-3 text-purple-500" />
                            <span className="font-medium">{subject.flashcardCount}</span>
                          </span>
                          <span className="flex items-center space-x-1 hover:bg-red-50 px-1 py-0.5 rounded transition-colors duration-200">
                            <Play className="w-3 h-3 text-red-500" />
                            <span className="font-medium">{subject.mediaCount}</span>
                          </span>
                        </div>

                        {/* Content Progress Bar */}
                        {subject.totalContent > 0 ? (
                          <div className="w-full">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Content progress</span>
                              <span>{subject.totalContent} items</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, Math.max(10, (subject.totalContent / 10) * 100))}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs w-fit animate-pulse border-red-300 text-red-600">
                            No content
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {subject.prerequisiteId ? (
                        <Badge variant="outline" className="text-xs">
                          {subject.prerequisiteId.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(subject.difficulty)}>
                        {subject.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>{subject.estimatedHours}h</TableCell>
                    <TableCell>{subject.xpReward}</TableCell>
                    <TableCell>
                      <Badge variant={subject.isUnlocked ? "default" : "secondary"}>
                        {subject.isUnlocked ? 'Published' : 'Draft'}
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
                            <Link href={`/subjects/${subject._id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/subjects/${subject._id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(subject._id.toString())}
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