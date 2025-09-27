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
  BarChart3
} from 'lucide-react';
import { Types } from 'mongoose';

interface Survey {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  triggerType: 'section_completion' | 'flashcard_completion' | 'media_completion';
  isActive: boolean;
  targeting: {
    type: 'all' | 'specific_sections' | 'specific_topics' | 'specific_subjects';
    sectionIds?: Types.ObjectId[];
    topicIds?: Types.ObjectId[];
    subjectIds?: Types.ObjectId[];
  };
  questions: {
    id: string;
    type: 'rating' | 'multiple_choice' | 'text';
    question: string;
    required: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const triggerTypeConfig = {
  section_completion: {
    color: 'bg-blue-100 text-blue-800',
    label: 'Section Completion'
  },
  flashcard_completion: {
    color: 'bg-green-100 text-green-800',
    label: 'Flashcard Completion'
  },
  media_completion: {
    color: 'bg-purple-100 text-purple-800',
    label: 'Media Completion'
  }
};

const formatTargeting = (survey: Survey) => {
  if (!survey.targeting) {
    return 'All content';
  }

  switch (survey.targeting.type) {
    case 'all':
      return 'All content';
    case 'specific_sections':
      const sectionCount = survey.targeting.sectionIds?.length || 0;
      return `${sectionCount} specific section${sectionCount !== 1 ? 's' : ''}`;
    case 'specific_topics':
      const topicCount = survey.targeting.topicIds?.length || 0;
      return `${topicCount} specific topic${topicCount !== 1 ? 's' : ''}`;
    case 'specific_subjects':
      const subjectCount = survey.targeting.subjectIds?.length || 0;
      return `${subjectCount} specific subject${subjectCount !== 1 ? 's' : ''}`;
    default:
      return 'All content';
  }
};

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTriggerType, setSelectedTriggerType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    filterSurveys();
  }, [surveys, searchTerm, selectedTriggerType, selectedStatus]);

  const fetchSurveys = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/surveys');
      if (!response.ok) {
        throw new Error('Failed to fetch surveys');
      }

      const data = await response.json();
      setSurveys(data);
    } catch (err) {
      console.error('Error fetching surveys:', err);
      setError(err instanceof Error ? err.message : 'Failed to load surveys');
    } finally {
      setIsLoading(false);
    }
  };

  const filterSurveys = () => {
    let filtered = surveys;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(survey =>
        survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        survey.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by trigger type
    if (selectedTriggerType !== 'all') {
      filtered = filtered.filter(survey => survey.triggerType === selectedTriggerType);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(survey =>
        selectedStatus === 'active' ? survey.isActive : !survey.isActive
      );
    }

    setFilteredSurveys(filtered);
  };

  const handleDelete = async (surveyId: string) => {
    if (!confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete survey');
      }

      await fetchSurveys();
    } catch (err) {
      console.error('Error deleting survey:', err);
      alert('Failed to delete survey. Please try again.');
    }
  };

  const toggleSurveyStatus = async (surveyId: string, currentStatus: boolean) => {
    try {
      const survey = surveys.find(s => s._id.toString() === surveyId);
      if (!survey) return;

      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...survey,
          isActive: !currentStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update survey status');
      }

      await fetchSurveys();
    } catch (err) {
      console.error('Error updating survey status:', err);
      alert('Failed to update survey status. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Surveys</h1>
            <p className="text-gray-600">Manage post-completion surveys</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
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
            <h1 className="text-3xl font-bold text-gray-900">Surveys</h1>
            <p className="text-gray-600">Manage post-completion surveys</p>
          </div>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={fetchSurveys} variant="outline">
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
          <h1 className="text-3xl font-bold text-gray-900">Surveys</h1>
          <p className="text-gray-600">Manage post-completion surveys for sections, flashcards, and media</p>
        </div>
        <Button asChild>
          <Link href="/admin/surveys/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Survey
          </Link>
        </Button>
      </div>


      {/* Filters and Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Surveys</CardTitle>
              <CardDescription>
                {filteredSurveys.length} of {surveys.length} surveys
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Trigger Type Filter */}
              <Select value={selectedTriggerType} onValueChange={setSelectedTriggerType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All trigger types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All trigger types</SelectItem>
                  <SelectItem value="section_completion">Section Completion</SelectItem>
                  <SelectItem value="flashcard_completion">Flashcard Completion</SelectItem>
                  <SelectItem value="media_completion">Media Completion</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search surveys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-56"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSurveys.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No surveys found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedTriggerType !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating a new survey.'}
              </p>
              {!searchTerm && selectedTriggerType === 'all' && selectedStatus === 'all' && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/admin/surveys/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Survey
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
                  <TableHead>Trigger Type</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Targeting</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSurveys.map((survey) => {
                  const typeConfig = triggerTypeConfig[survey.triggerType];

                  return (
                    <TableRow key={survey._id.toString()}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{survey.title}</div>
                          {survey.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {survey.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={typeConfig.color} variant="outline">
                          {typeConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {survey.questions.length} question{survey.questions.length !== 1 ? 's' : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatTargeting(survey)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={survey.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          variant="outline"
                        >
                          {survey.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(survey.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex items-center justify-end space-x-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/admin/surveys/${survey._id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View survey</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/admin/surveys/${survey._id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit survey</p>
                              </TooltipContent>
                            </Tooltip>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => toggleSurveyStatus(survey._id.toString(), survey.isActive)}
                                >
                                  {survey.isActive ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/surveys/${survey._id}/responses`}>
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    View Responses
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(survey._id.toString())}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}