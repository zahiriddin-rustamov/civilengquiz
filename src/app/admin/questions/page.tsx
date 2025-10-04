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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  Move,
  Settings
} from 'lucide-react';
import { ISubject, ITopic } from '@/models/database';
import { Types } from 'mongoose';

interface QuestionWithData {
  _id: Types.ObjectId;
  topicId: Types.ObjectId;
  sectionId: Types.ObjectId;
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
  sectionName: string;
  sectionOrder: number;
}

interface SectionGroup {
  sectionId: string;
  sectionName: string;
  sectionOrder: number;
  questions: QuestionWithData[];
  totalQuestions: number;
  totalXP: number;
  typeBreakdown: { [key: string]: number };
}

interface TopicGroup {
  subjectName: string;
  topicId: string;
  topicName: string;
  sections: SectionGroup[];
  totalQuestions: number;
  totalXP: number;
  totalSections: number;
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
  const [allTopicCombinations, setAllTopicCombinations] = useState<any[]>([]);
  const [allSections, setAllSections] = useState<any[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionWithData[]>([]);
  const [groupedQuestions, setGroupedQuestions] = useState<TopicGroup[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [selectedTopicForSection, setSelectedTopicForSection] = useState<string | null>(null);
  const [sectionFormData, setSectionFormData] = useState({
    name: '',
    description: '',
  });
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [showSectionSettingsModal, setShowSectionSettingsModal] = useState(false);
  const [selectedTopicForSettings, setSelectedTopicForSettings] = useState<string | null>(null);
  const [topicSectionSettings, setTopicSectionSettings] = useState({
    unlockConditions: 'always' as 'always' | 'sequential' | 'score-based',
    requiredScore: 70,
    requireCompletion: false,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

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
    // Group filtered questions by topic with nested sections and include empty topic combinations and sections
    const groups = groupQuestionsByTopicAndSection(filteredQuestions, allTopicCombinations, allSections);
    setGroupedQuestions(groups);
  }, [filteredQuestions, allTopicCombinations, allSections, subjects]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/questions?includeAllTopics=true');
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setQuestions(data.questions || []);
      setAllTopicCombinations(data.allTopicCombinations || []);
      setAllSections(data.allSections || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects?includeEmpty=true');
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
        question.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.sectionName?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const groupQuestionsByTopicAndSection = (questionItems: QuestionWithData[], allTopics: any[] = [], allSections: any[] = []): TopicGroup[] => {
    const topicMap = new Map<string, TopicGroup>();

    // First, create groups from all available topics (including empty ones)
    allTopics.forEach(topic => {
      if (!topic._id || !topic.name || !topic.subjectName) {
        return;
      }

      const topicKey = `${topic.subjectName}-${topic._id.toString()}`;
      if (!topicMap.has(topicKey)) {
        topicMap.set(topicKey, {
          subjectName: topic.subjectName,
          topicId: topic._id.toString(),
          topicName: topic.name,
          sections: [],
          totalQuestions: 0,
          totalXP: 0,
          totalSections: 0,
        });
      }
    });

    // Then, add all available sections (including empty ones) to their respective topics
    allSections.forEach(section => {
      if (!section._id || !section.name || !section.topicId || !section.subjectName || !section.topicName) {
        return;
      }

      const topicKey = `${section.subjectName}-${section.topicId.toString()}`;

      // Create topic group if it doesn't exist (fallback for sections without matching allTopics)
      if (!topicMap.has(topicKey)) {
        topicMap.set(topicKey, {
          subjectName: section.subjectName,
          topicId: section.topicId.toString(),
          topicName: section.topicName,
          sections: [],
          totalQuestions: 0,
          totalXP: 0,
          totalSections: 0,
        });
      }

      const topicGroup = topicMap.get(topicKey)!;

      // Check if section already exists in this topic
      const existingSection = topicGroup.sections.find(s => s.sectionId === section._id.toString());
      if (!existingSection) {
        topicGroup.sections.push({
          sectionId: section._id.toString(),
          sectionName: section.name,
          sectionOrder: section.order || 0,
          questions: [],
          totalQuestions: 0,
          totalXP: 0,
          typeBreakdown: {},
        });
        topicGroup.totalSections++;
      }
    });

    // Then, populate with existing questions
    questionItems.forEach(item => {
      // Handle missing properties safely
      if (!item.topicId || !item.topicName || !item.subjectName || !item.sectionId || !item.sectionName) {
        console.warn('Question missing required properties:', item);
        return;
      }

      const topicKey = `${item.subjectName}-${item.topicId.toString()}`;

      // Create topic group if it doesn't exist (fallback for questions without matching allTopics)
      if (!topicMap.has(topicKey)) {
        topicMap.set(topicKey, {
          subjectName: item.subjectName,
          topicId: item.topicId.toString(),
          topicName: item.topicName,
          sections: [],
          totalQuestions: 0,
          totalXP: 0,
          totalSections: 0,
        });
      }

      const topicGroup = topicMap.get(topicKey)!;

      // Find or create section within this topic
      let sectionGroup = topicGroup.sections.find(s => s.sectionId === item.sectionId.toString());
      if (!sectionGroup) {
        sectionGroup = {
          sectionId: item.sectionId.toString(),
          sectionName: item.sectionName,
          sectionOrder: item.sectionOrder || 0,
          questions: [],
          totalQuestions: 0,
          totalXP: 0,
          typeBreakdown: {},
        };
        topicGroup.sections.push(sectionGroup);
        topicGroup.totalSections++;
      }

      // Add question to section
      sectionGroup.questions.push(item);
      sectionGroup.totalQuestions++;
      sectionGroup.totalXP += item.xpReward || 0;

      // Update topic totals
      topicGroup.totalQuestions++;
      topicGroup.totalXP += item.xpReward || 0;

      // Count question types for section
      const typeLabel = questionTypeConfig[item.type]?.label || item.type;
      sectionGroup.typeBreakdown[typeLabel] = (sectionGroup.typeBreakdown[typeLabel] || 0) + 1;
    });

    // Sort topic groups and sections within each topic
    const sortedTopics = Array.from(topicMap.values()).sort((a, b) => {
      if (a.subjectName !== b.subjectName) {
        return a.subjectName.localeCompare(b.subjectName);
      }
      return a.topicName.localeCompare(b.topicName);
    });

    // Sort sections within each topic
    sortedTopics.forEach(topic => {
      topic.sections.sort((a, b) => a.sectionOrder - b.sectionOrder);
    });

    return sortedTopics;
  };

  const toggleTopicExpansion = (topicKey: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicKey)) {
        newSet.delete(topicKey);
      } else {
        newSet.add(topicKey);
      }
      return newSet;
    });
  };

  const toggleSectionExpansion = (sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
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

  const handleCreateSection = async () => {
    if (!selectedTopicForSection || !sectionFormData.name.trim()) {
      return;
    }

    try {
      setIsCreatingSection(true);

      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sectionFormData.name,
          description: sectionFormData.description,
          topicId: selectedTopicForSection,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create section');
      }

      // Reset form and close modal
      setSectionFormData({ name: '', description: '' });
      setShowSectionModal(false);
      setSelectedTopicForSection(null);

      // Refresh questions to show new section
      await fetchQuestions();
    } catch (err) {
      console.error('Error creating section:', err);
      alert('Failed to create section. Please try again.');
    } finally {
      setIsCreatingSection(false);
    }
  };

  const loadSectionSettings = async (topicId: string) => {
    try {
      setSettingsError(null);

      // Get settings from the topic
      const response = await fetch(`/api/topics/${topicId}`);
      if (!response.ok) {
        throw new Error('Failed to load topic settings');
      }

      const topicData = await response.json();

      if (topicData.sectionSettings) {
        setTopicSectionSettings({
          unlockConditions: topicData.sectionSettings.unlockConditions || 'always',
          requiredScore: topicData.sectionSettings.requiredScore || 70,
          requireCompletion: topicData.sectionSettings.requireCompletion || false,
        });
      } else {
        // Set defaults if no settings exist
        setTopicSectionSettings({
          unlockConditions: 'always',
          requiredScore: 70,
          requireCompletion: false,
        });
      }
    } catch (err) {
      console.error('Error loading topic settings:', err);
      setSettingsError('Failed to load topic settings');
    }
  };

  const saveSectionSettings = async () => {
    if (!selectedTopicForSettings) {
      setSettingsError('No topic selected for settings update');
      return;
    }

    try {
      setIsSavingSettings(true);
      setSettingsError(null);

      const response = await fetch(`/api/topics/${selectedTopicForSettings}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionSettings: topicSectionSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save topic settings');
      }

      // Close modal and reset state
      setShowSectionSettingsModal(false);
      setSelectedTopicForSettings(null);

      // Show success message
      alert('Section settings saved successfully!');

      // Refresh questions to show updated data
      await fetchQuestions();
    } catch (err) {
      console.error('Error saving topic settings:', err);
      setSettingsError('Failed to save topic settings. Please try again.');
    } finally {
      setIsSavingSettings(false);
    }
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
                {filteredQuestions.length} of {questions.length} questions • {groupedQuestions.length} topics • {groupedQuestions.reduce((sum, topic) => sum + topic.totalSections, 0)} sections
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
            <div className="space-y-6">
              {groupedQuestions.map((topicGroup) => {
                const topicKey = `${topicGroup.subjectName}-${topicGroup.topicId}`;
                const isTopicExpanded = expandedTopics.has(topicKey);
                const hasExpandableContent = topicGroup.totalSections > 0;

                return (
                  <div key={topicKey} className="border rounded-lg overflow-hidden">
                    {/* Topic Header */}
                    <div
                      className={`bg-gray-50 border-b p-4 transition-colors ${
                        hasExpandableContent
                          ? 'cursor-pointer hover:bg-gray-100'
                          : 'cursor-default'
                      }`}
                      onClick={() => hasExpandableContent && toggleTopicExpansion(topicKey)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {hasExpandableContent ? (
                              isTopicExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
                            ) : (
                              <div className="w-5 h-5 flex items-center justify-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              </div>
                            )}
                            <div className="text-left">
                              <div className="font-semibold text-gray-900 text-lg">
                                {topicGroup.subjectName} → {topicGroup.topicName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {topicGroup.totalSections} sections • {topicGroup.totalQuestions} questions • {topicGroup.totalXP} XP total
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Topic Actions */}
                        <div
                          className="flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TooltipProvider>
                            <div className="flex items-center">
                              {topicGroup.totalQuestions > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" asChild>
                                      <Link href={`/admin/questions/reorder?topicId=${topicGroup.topicId}`}>
                                        <Move className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Reorder questions in topic</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTopicForSection(topicGroup.topicId);
                                      setShowSectionModal(true);
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Add section to topic</p>
                                </TooltipContent>
                              </Tooltip>
                              {topicGroup.totalSections > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={async () => {
                                        setSelectedTopicForSettings(topicGroup.topicId);
                                        setShowSectionSettingsModal(true);
                                        await loadSectionSettings(topicGroup.topicId);
                                      }}
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Configure section settings</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Find the subject ID by name
                                      const subject = subjects.find(s => s.name === topicGroup.subjectName);
                                      if (subject) {
                                        setSelectedSubject(subject._id.toString());
                                        setSelectedTopic(topicGroup.topicId);
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

                    {/* Expanded Topic Content - Sections */}
                    {isTopicExpanded && hasExpandableContent && (
                      <div className="bg-white">
                        {topicGroup.sections.map((section) => {
                          const sectionKey = `${topicKey}-${section.sectionId}`;
                          const isSectionExpanded = expandedSections.has(sectionKey);
                          const sectionHasQuestions = section.totalQuestions > 0;

                          return (
                            <div key={sectionKey} className="border-b last:border-b-0">
                              {/* Section Header */}
                              <div
                                className={`bg-gray-25 p-3 transition-colors ${
                                  sectionHasQuestions
                                    ? 'cursor-pointer hover:bg-gray-50'
                                    : 'cursor-default'
                                }`}
                                onClick={() => sectionHasQuestions && toggleSectionExpansion(sectionKey)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2 ml-4">
                                      {sectionHasQuestions ? (
                                        isSectionExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                      ) : (
                                        <div className="w-4 h-4 flex items-center justify-center">
                                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                        </div>
                                      )}
                                      <div className="text-left">
                                        <div className="font-medium text-gray-900">
                                          {section.sectionName}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          Section {section.sectionOrder} • {section.totalQuestions} questions • {section.totalXP} XP
                                          {Object.keys(section.typeBreakdown).length > 0 && (
                                            <span className="ml-2">
                                              ({Object.entries(section.typeBreakdown).map(([type, count]) => `${count} ${type}`).join(', ')})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Section Actions */}
                                  <div
                                    className="flex items-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <TooltipProvider>
                                      <div className="flex items-center">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" asChild>
                                              <Link href={`/admin/questions/new?topicId=${topicGroup.topicId}&sectionId=${section.sectionId}`}>
                                                <Plus className="h-4 w-4" />
                                              </Link>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Add question to section</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </TooltipProvider>
                                  </div>
                                </div>
                              </div>

                              {/* Expanded Section Content - Questions */}
                              {isSectionExpanded && sectionHasQuestions && (
                                <div className="p-4 bg-gray-25">
                                  <div className="space-y-3">
                                    {section.questions
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

                                            {/* Question Actions */}
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

      {/* Section Creation Modal */}
      <Dialog open={showSectionModal} onOpenChange={setShowSectionModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>
              Create a new section for organizing questions within this topic.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="section-name" className="text-right">
                Name
              </Label>
              <Input
                id="section-name"
                value={sectionFormData.name}
                onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
                className="col-span-3"
                placeholder="Enter section name"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="section-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="section-description"
                value={sectionFormData.description}
                onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                className="col-span-3"
                placeholder="Enter section description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSectionModal(false);
                setSectionFormData({ name: '', description: '' });
                setSelectedTopicForSection(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSection}
              disabled={!sectionFormData.name.trim() || isCreatingSection}
            >
              {isCreatingSection ? 'Creating...' : 'Create Section'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Settings Modal */}
      <Dialog open={showSectionSettingsModal} onOpenChange={setShowSectionSettingsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Section Settings</DialogTitle>
            <DialogDescription>
              Configure how sections are presented to students in this topic.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Error display */}
            {settingsError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {settingsError}
                </AlertDescription>
              </Alert>
            )}

            {/* Section Access Control */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Section Access Control</Label>
              <p className="text-sm text-gray-600">
                All sections are always visible to students. Choose how they unlock:
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="unlock-always"
                    name="unlockConditions"
                    value="always"
                    checked={topicSectionSettings.unlockConditions === 'always'}
                    onChange={(e) => setTopicSectionSettings({ ...topicSectionSettings, unlockConditions: e.target.value as any })}
                  />
                  <Label htmlFor="unlock-always" className="text-sm">
                    <strong>Free Access:</strong> Students can access any section immediately
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="unlock-sequential"
                    name="unlockConditions"
                    value="sequential"
                    checked={topicSectionSettings.unlockConditions === 'sequential'}
                    onChange={(e) => setTopicSectionSettings({ ...topicSectionSettings, unlockConditions: e.target.value as any })}
                  />
                  <Label htmlFor="unlock-sequential" className="text-sm">
                    <strong>Sequential:</strong> Must complete previous section to unlock next
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="unlock-score-based"
                    name="unlockConditions"
                    value="score-based"
                    checked={topicSectionSettings.unlockConditions === 'score-based'}
                    onChange={(e) => setTopicSectionSettings({ ...topicSectionSettings, unlockConditions: e.target.value as any })}
                  />
                  <Label htmlFor="unlock-score-based" className="text-sm">
                    <strong>Score Based:</strong> Must achieve minimum score to unlock next section
                  </Label>
                </div>
              </div>

              {/* Required score input (only show if score-based is selected) */}
              {topicSectionSettings.unlockConditions === 'score-based' && (
                <div className="ml-6 mt-2 flex items-center space-x-2">
                  <Label htmlFor="required-score" className="text-sm">
                    Minimum Score:
                  </Label>
                  <Input
                    id="required-score"
                    type="number"
                    min="1"
                    max="100"
                    value={topicSectionSettings.requiredScore}
                    onChange={(e) => setTopicSectionSettings({
                      ...topicSectionSettings,
                      requiredScore: parseInt(e.target.value) || 70
                    })}
                    className="w-16"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              )}
            </div>

            {/* Completion Requirements */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Completion Requirements</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="require-completion"
                  checked={topicSectionSettings.requireCompletion}
                  onCheckedChange={(checked) => setTopicSectionSettings({
                    ...topicSectionSettings,
                    requireCompletion: checked as boolean
                  })}
                />
                <Label htmlFor="require-completion" className="text-sm">
                  Students must answer all questions to complete the section
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                {topicSectionSettings.requireCompletion
                  ? "Students must answer every question to mark the section as complete"
                  : "Students can mark section complete even if they skip questions"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSectionSettingsModal(false);
                setSelectedTopicForSettings(null);
                setSettingsError(null);
              }}
              disabled={isSavingSettings}
            >
              Cancel
            </Button>
            <Button
              onClick={saveSectionSettings}
              disabled={isSavingSettings}
            >
              {isSavingSettings ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}