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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  FileText,
  Zap,
  BookOpen,
  CheckCircle,
  Edit3,
  Calculator,
  Shuffle,
  Clock,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Move
} from 'lucide-react';
import { ISubject, ITopic } from '@/models/database';
import { Types } from 'mongoose';

interface QuestionWithData {
  _id: Types.ObjectId;
  topicId: Types.ObjectId;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'numerical' | 'matching';
  text: string;
  imageUrl?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  estimatedMinutes: number;
  order: number;
  data: any;
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
  topicName: string;
  subjectName: string;
}

interface QuestionGroup {
  subjectName: string;
  topicId: string;
  topicName: string;
  questions: QuestionWithData[];
  totalQuestions: number;
  totalXP: number;
  typeBreakdown: { [key: string]: number };
}

const questionTypeConfig = {
  'multiple-choice': { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', label: 'Multiple Choice' },
  'true-false': { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'True/False' },
  'fill-in-blank': { icon: Edit3, color: 'bg-purple-100 text-purple-800', label: 'Fill in Blank' },
  'numerical': { icon: Calculator, color: 'bg-orange-100 text-orange-800', label: 'Numerical' },
  'matching': { icon: Shuffle, color: 'bg-pink-100 text-pink-800', label: 'Matching' }
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionWithData[]>([]);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionWithData[]>([]);
  const [groupedQuestions, setGroupedQuestions] = useState<QuestionGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
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
    filterQuestions();
  }, [questions, searchTerm, selectedSubject, selectedTopic, selectedType, selectedDifficulty, subjects]);

  useEffect(() => {
    // Group filtered questions by subject-topic combination
    const groups = groupQuestionsByTopic(filteredQuestions);
    setGroupedQuestions(groups);
  }, [filteredQuestions, subjects]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/questions');
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
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

  const filterQuestions = () => {
    let filtered = questions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(question =>
        question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(question => question.subjectName === getSubjectName(selectedSubject));
    }

    // Filter by topic
    if (selectedTopic !== 'all') {
      filtered = filtered.filter(question => question.topicId.toString() === selectedTopic);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(question => question.type === selectedType);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(question => question.difficulty === selectedDifficulty);
    }

    setFilteredQuestions(filtered);
  };

  const groupQuestionsByTopic = (questionItems: QuestionWithData[]): QuestionGroup[] => {
    const groupMap = new Map<string, QuestionGroup>();

    questionItems.forEach(item => {
      // Handle missing properties safely
      if (!item.topicId || !item.topicName || !item.subjectName) {
        console.warn('Question missing required properties:', item);
        return;
      }

      const key = `${item.subjectName}-${item.topicId.toString()}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          subjectName: item.subjectName,
          topicId: item.topicId.toString(),
          topicName: item.topicName,
          questions: [],
          totalQuestions: 0,
          totalXP: 0,
          typeBreakdown: {},
        });
      }

      const group = groupMap.get(key)!;
      group.questions.push(item);
      group.totalQuestions++;
      group.totalXP += item.xpReward || 0;

      // Count question types
      const typeLabel = questionTypeConfig[item.type]?.label || item.type;
      group.typeBreakdown[typeLabel] = (group.typeBreakdown[typeLabel] || 0) + 1;
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

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      await fetchQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Failed to delete question. Please try again.');
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


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
            <p className="text-gray-600">Manage all questions across subjects and topics</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
            <p className="text-gray-600">Manage all questions across subjects and topics</p>
          </div>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={fetchQuestions} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
          <p className="text-gray-600">Manage all questions across subjects and topics</p>
        </div>
        <div className="flex space-x-2">
          {selectedTopic !== 'all' && (
            <Button asChild variant="outline">
              <Link href={`/admin/questions/new?topicId=${selectedTopic}`}>
                <Plus className="w-4 h-4 mr-2" />
                Add to Topic
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/admin/questions/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Link>
          </Button>
        </div>
      </div>


      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Questions</CardTitle>
              <CardDescription>
                {filteredQuestions.length} of {questions.length} questions • {groupedQuestions.length} topic groups
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

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                  <SelectItem value="true-false">True/False</SelectItem>
                  <SelectItem value="fill-in-blank">Fill in Blank</SelectItem>
                  <SelectItem value="numerical">Numerical</SelectItem>
                  <SelectItem value="matching">Matching</SelectItem>
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
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-56"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {groupedQuestions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedSubject !== 'all' || selectedTopic !== 'all' || selectedType !== 'all' || selectedDifficulty !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating a new question.'}
              </p>
              {!searchTerm && selectedSubject === 'all' && selectedTopic === 'all' && selectedType === 'all' && selectedDifficulty === 'all' && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/admin/questions/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedQuestions.map((group) => {
                const groupKey = `${group.subjectName}-${group.topicId}`;
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
                                {group.totalQuestions} questions • {group.totalXP} XP total
                                {Object.keys(group.typeBreakdown).length > 0 && (
                                  <span className="ml-2">
                                    ({Object.entries(group.typeBreakdown).map(([type, count]) => `${count} ${type}`).join(', ')})
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
                              {group.totalQuestions > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" asChild>
                                      <Link href={`/admin/questions/reorder?topicId=${group.topicId}`}>
                                        <Move className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Reorder questions</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/admin/questions/new?topicId=${group.topicId}`}>
                                      <Plus className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Add question to topic</p>
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
                    {isExpanded && (
                      <div className="p-4">
                        <div className="space-y-3">
                          {group.questions
                            .sort((a, b) => a.order - b.order)
                            .map((question) => {
                              const typeConfig = questionTypeConfig[question.type];
                              const IconComponent = typeConfig?.icon || FileText;

                              return (
                                <div key={question._id.toString()} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center space-x-3 flex-1">
                                    <div className="flex items-center space-x-2">
                                      <Badge className={typeConfig?.color || 'bg-gray-100 text-gray-800'} variant="outline">
                                        <IconComponent className="w-3 h-3 mr-1" />
                                        #{question.order}
                                      </Badge>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start space-x-3">
                                        {question.imageUrl && (
                                          <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                                            <img
                                              src={question.imageUrl}
                                              alt=""
                                              className="w-full h-full object-cover rounded"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                              }}
                                            />
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <div className="font-medium text-gray-900 truncate" title={question.text}>
                                            {question.text}
                                          </div>
                                          <div className="text-sm text-gray-500 flex items-center space-x-2 mt-1">
                                            <span>{typeConfig?.label || question.type}</span>
                                            {question.explanation && <span>• Has explanation</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                      <Badge className={getDifficultyColor(question.difficulty)} variant="outline">
                                        {question.difficulty}
                                      </Badge>
                                      <div className="flex items-center space-x-1">
                                        <Zap className="w-3 h-3 text-yellow-500" />
                                        <span className="text-sm">{question.xpReward} XP</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Clock className="w-3 h-3 text-gray-500" />
                                        <span className="text-sm">{question.estimatedMinutes}m</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Separator and Individual Question Actions */}
                                  <div className="flex items-center">
                                    <div className="w-px h-6 bg-gray-200 mx-3"></div>
                                    <TooltipProvider>
                                      <div className="flex items-center">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" asChild>
                                              <Link href={`/admin/questions/${question._id}`}>
                                                <Eye className="h-4 w-4" />
                                              </Link>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>View question</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" asChild>
                                              <Link href={`/admin/questions/${question._id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                              </Link>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Edit question</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDelete(question._id.toString())}
                                              className="text-red-600 hover:text-red-600 hover:bg-red-50"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Delete question</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </TooltipProvider>
                                  </div>
                                </div>
                              );
                            })}
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

      {/* Quick Actions */}
      {selectedTopic !== 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Actions for the selected topic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild variant="outline">
                <Link href={`/admin/questions/reorder?topicId=${selectedTopic}`}>
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Reorder Questions
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/admin/questions/new?topicId=${selectedTopic}`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question to Topic
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}