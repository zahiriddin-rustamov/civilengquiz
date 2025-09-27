'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { ContentAnalyticsCard } from './ContentAnalyticsCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  FileText,
  Layers,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Users,
  Filter,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { Types } from 'mongoose';

interface SurveyResponse {
  _id: Types.ObjectId;
  surveyId: {
    _id: string;
    title: string;
    triggerType: string;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  triggerContentId: Types.ObjectId;
  triggerType: string;
  responses: {
    questionId: string;
    answer: any;
  }[];
  completedAt: Date;
  timeSpent: number;
  contentInfo?: {
    type: string;
    name: string;
    topicName?: string;
    subjectName?: string;
    path: string;
  };
}

interface Survey {
  _id: Types.ObjectId;
  title: string;
  triggerType: 'section_completion' | 'flashcard_completion' | 'media_completion';
  questions: {
    id: string;
    type: 'rating' | 'multiple_choice' | 'text';
    question: string;
    scale?: { min: number; max: number };
  }[];
}

interface ContentGroupTabsProps {
  responses: SurveyResponse[];
  survey: Survey;
  className?: string;
}

export function ContentGroupTabs({ responses, survey, className = "" }: ContentGroupTabsProps) {
  // Determine if "By Section" tab should be shown
  const showSectionTab = survey.triggerType === 'section_completion';

  // State for content filtering within tabs
  const [contentFilters, setContentFilters] = useState({
    selectedSection: '',
    selectedTopic: '',
    selectedSubject: '',
    sectionSortBy: 'name', // name, responses, rating
    topicSortBy: 'name',
    subjectSortBy: 'name'
  });

  // Group responses by different criteria
  const groupedData = {
    all: responses,
    bySection: groupBySection(responses),
    byTopic: groupByTopic(responses),
    bySubject: groupBySubject(responses)
  };

  // Get overall analytics for comparison
  const overallAnalytics = calculateOverallAnalytics(responses, survey);

  // Filter and sort content groups
  const getFilteredAndSortedEntries = (groupedItems: Record<string, SurveyResponse[]>, selectedItem: string, sortBy: string) => {
    let entries = Object.entries(groupedItems);

    // Filter by selected item
    if (selectedItem.trim()) {
      entries = entries.filter(([key, items]) => {
        const contentName = items[0]?.contentInfo?.name || key;
        return contentName === selectedItem;
      });
    }

    // Sort entries
    entries.sort(([keyA, itemsA], [keyB, itemsB]) => {
      switch (sortBy) {
        case 'responses':
          return itemsB.length - itemsA.length; // Descending by response count
        case 'rating':
          const analyticsA = calculateContentAnalytics(itemsA, survey);
          const analyticsB = calculateContentAnalytics(itemsB, survey);
          const ratingA = analyticsA.averageRating || 0;
          const ratingB = analyticsB.averageRating || 0;
          return ratingB - ratingA; // Descending by rating
        case 'name':
        default:
          const nameA = itemsA[0]?.contentInfo?.name || keyA;
          const nameB = itemsB[0]?.contentInfo?.name || keyB;
          return nameA.localeCompare(nameB); // Ascending by name
      }
    });

    return entries;
  };

  // Content filter component with combobox
  const ContentFilter = ({
    selectedValue,
    onSelectedChange,
    sortValue,
    onSortChange,
    placeholder,
    totalCount,
    filteredCount,
    options
  }: {
    selectedValue: string;
    onSelectedChange: (value: string) => void;
    sortValue: string;
    onSortChange: (value: string) => void;
    placeholder: string;
    totalCount: number;
    filteredCount: number;
    options: Array<{ value: string; label: string; path?: string }>;
  }) => {
    const [open, setOpen] = useState(false);

    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">
                Select {placeholder}
              </Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedValue
                      ? options.find((option) => option.value === selectedValue)?.label
                      : `Select ${placeholder.toLowerCase()}...`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
                    <CommandEmpty>No {placeholder.toLowerCase()} found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value=""
                        onSelect={() => {
                          onSelectedChange("");
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${selectedValue === "" ? "opacity-100" : "opacity-0"}`}
                        />
                        Show all {placeholder.toLowerCase()}
                      </CommandItem>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={(currentValue) => {
                            onSelectedChange(currentValue === selectedValue ? "" : currentValue);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${selectedValue === option.value ? "opacity-100" : "opacity-0"}`}
                          />
                          <div>
                            <div className="font-medium">{option.label}</div>
                            {option.path && (
                              <div className="text-xs text-gray-500">{option.path}</div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-48">
              <Label htmlFor="sort" className="flex items-center gap-1 text-sm font-medium">
                <Filter className="h-3 w-3" />
                Sort By
              </Label>
              <Select value={sortValue} onValueChange={onSortChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="responses">Response Count</SelectItem>
                  <SelectItem value="rating">Average Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {filteredCount} of {totalCount}
              </div>
              <div className="text-xs text-gray-500">
                {placeholder} shown
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={className}>
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className={`grid w-full ${showSectionTab ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Responses
            <Badge variant="secondary" className="ml-1">
              {responses.length}
            </Badge>
          </TabsTrigger>
          {showSectionTab && (
            <TabsTrigger value="bySection" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              By Section
              <Badge variant="secondary" className="ml-1">
                {Object.keys(groupedData.bySection).length}
              </Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="byTopic" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            By Topic
            <Badge variant="secondary" className="ml-1">
              {Object.keys(groupedData.byTopic).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="bySubject" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            By Subject
            <Badge variant="secondary" className="ml-1">
              {Object.keys(groupedData.bySubject).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* All Responses Tab */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Overall Performance
              </CardTitle>
              <CardDescription>
                Aggregated analytics across all responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{overallAnalytics.totalResponses}</div>
                  <div className="text-sm text-gray-500">Total Responses</div>
                </div>
                {overallAnalytics.averageRating && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {overallAnalytics.averageRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">Average Rating</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(overallAnalytics.averageTimeSpent)}s
                  </div>
                  <div className="text-sm text-gray-500">Average Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <IndividualResponsesTable responses={responses} survey={survey} />
        </TabsContent>

        {/* By Section Tab - Only show for section completion surveys */}
        {showSectionTab && (
        <TabsContent value="bySection" className="space-y-6">
          {Object.keys(groupedData.bySection).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Section Data</h3>
                <p className="text-gray-500">No responses found for section-based content.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {(() => {
                const filteredEntries = getFilteredAndSortedEntries(
                  groupedData.bySection,
                  contentFilters.selectedSection,
                  contentFilters.sectionSortBy
                );

                // Generate options for combobox
                const sectionOptions = Object.entries(groupedData.bySection).map(([sectionId, sectionResponses]) => ({
                  value: sectionResponses[0]?.contentInfo?.name || sectionId,
                  label: sectionResponses[0]?.contentInfo?.name || sectionId,
                  path: sectionResponses[0]?.contentInfo?.path
                }));

                return (
                  <>
                    <ContentFilter
                      selectedValue={contentFilters.selectedSection}
                      onSelectedChange={(value) => setContentFilters(prev => ({ ...prev, selectedSection: value }))}
                      sortValue={contentFilters.sectionSortBy}
                      onSortChange={(value) => setContentFilters(prev => ({ ...prev, sectionSortBy: value }))}
                      placeholder="Sections"
                      totalCount={Object.keys(groupedData.bySection).length}
                      filteredCount={filteredEntries.length}
                      options={sectionOptions}
                    />
                    <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
                      {filteredEntries.map(([sectionId, sectionResponses]) => {
                        const analytics = calculateContentAnalytics(sectionResponses, survey);
                        const contentInfo = sectionResponses[0]?.contentInfo;

                        if (!contentInfo) return null;

                        return (
                          <ContentAnalyticsCard
                            key={sectionId}
                            contentInfo={{
                              id: sectionId,
                              name: contentInfo.name,
                              path: contentInfo.path,
                              type: 'Section'
                            }}
                            analytics={analytics}
                            ratingScale={{ min: 1, max: 5 }}
                            showTimeline={true}
                          />
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </TabsContent>
        )}

        {/* By Topic Tab */}
        <TabsContent value="byTopic" className="space-y-6">
          {Object.keys(groupedData.byTopic).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Topic Data</h3>
                <p className="text-gray-500">No responses found for topic-based content.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {(() => {
                const filteredEntries = getFilteredAndSortedEntries(
                  groupedData.byTopic,
                  contentFilters.selectedTopic,
                  contentFilters.topicSortBy
                );

                // Generate options for combobox
                const topicOptions = Object.entries(groupedData.byTopic).map(([topicKey, topicResponses]) => ({
                  value: topicResponses[0]?.contentInfo?.topicName || topicResponses[0]?.contentInfo?.name || topicKey,
                  label: topicResponses[0]?.contentInfo?.topicName || topicResponses[0]?.contentInfo?.name || topicKey,
                  path: topicResponses[0]?.contentInfo?.path
                }));

                return (
                  <>
                    <ContentFilter
                      selectedValue={contentFilters.selectedTopic}
                      onSelectedChange={(value) => setContentFilters(prev => ({ ...prev, selectedTopic: value }))}
                      sortValue={contentFilters.topicSortBy}
                      onSortChange={(value) => setContentFilters(prev => ({ ...prev, topicSortBy: value }))}
                      placeholder="Topics"
                      totalCount={Object.keys(groupedData.byTopic).length}
                      filteredCount={filteredEntries.length}
                      options={topicOptions}
                    />
                    <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
                      {filteredEntries.map(([topicKey, topicResponses]) => {
                        const analytics = calculateContentAnalytics(topicResponses, survey);
                        const contentInfo = topicResponses[0]?.contentInfo;

                        if (!contentInfo) return null;

                        return (
                          <ContentAnalyticsCard
                            key={topicKey}
                            contentInfo={{
                              id: topicKey,
                              name: contentInfo.topicName || contentInfo.name,
                              path: contentInfo.path,
                              type: 'Topic'
                            }}
                            analytics={analytics}
                            ratingScale={{ min: 1, max: 5 }}
                            showTimeline={true}
                          />
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </TabsContent>

        {/* By Subject Tab */}
        <TabsContent value="bySubject" className="space-y-6">
          {Object.keys(groupedData.bySubject).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Subject Data</h3>
                <p className="text-gray-500">No responses found for subject-based content.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {(() => {
                const filteredEntries = getFilteredAndSortedEntries(
                  groupedData.bySubject,
                  contentFilters.selectedSubject,
                  contentFilters.subjectSortBy
                );

                // Generate options for combobox
                const subjectOptions = Object.entries(groupedData.bySubject).map(([subjectKey, subjectResponses]) => ({
                  value: subjectResponses[0]?.contentInfo?.subjectName || subjectKey,
                  label: subjectResponses[0]?.contentInfo?.subjectName || subjectKey,
                  path: `${subjectResponses.length} responses`
                }));

                return (
                  <>
                    <ContentFilter
                      selectedValue={contentFilters.selectedSubject}
                      onSelectedChange={(value) => setContentFilters(prev => ({ ...prev, selectedSubject: value }))}
                      sortValue={contentFilters.subjectSortBy}
                      onSortChange={(value) => setContentFilters(prev => ({ ...prev, subjectSortBy: value }))}
                      placeholder="Subjects"
                      totalCount={Object.keys(groupedData.bySubject).length}
                      filteredCount={filteredEntries.length}
                      options={subjectOptions}
                    />
                    <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
                      {filteredEntries.map(([subjectKey, subjectResponses]) => {
                        const analytics = calculateContentAnalytics(subjectResponses, survey);
                        const contentInfo = subjectResponses[0]?.contentInfo;

                        if (!contentInfo) return null;

                        return (
                          <ContentAnalyticsCard
                            key={subjectKey}
                            contentInfo={{
                              id: subjectKey,
                              name: contentInfo.subjectName || 'Unknown Subject',
                              path: `${contentInfo.subjectName} (${subjectResponses.length} responses)`,
                              type: 'Subject'
                            }}
                            analytics={analytics}
                            ratingScale={{ min: 1, max: 5 }}
                            showTimeline={true}
                          />
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Individual responses table component
function IndividualResponsesTable({ responses, survey }: { responses: SurveyResponse[], survey: Survey }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Individual Responses
        </CardTitle>
        <CardDescription>
          Detailed view of all survey responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No responses</h3>
            <p className="mt-1 text-sm text-gray-500">
              Responses will appear here when users complete this survey.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Completed At</TableHead>
                <TableHead>Time Spent</TableHead>
                <TableHead>Responses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((response) => (
                <TableRow key={response._id.toString()}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{response.userId.name}</div>
                      <div className="text-sm text-gray-500">{response.userId.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {response.contentInfo ? (
                        <>
                          <div className="font-medium text-sm">{response.contentInfo.name}</div>
                          <div className="text-xs text-gray-500">{response.contentInfo.path}</div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-400">Content not found</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(response.completedAt).toLocaleDateString()} at{' '}
                      {new Date(response.completedAt).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{response.timeSpent}s</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {response.responses.length} of {survey.questions.length} questions
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions for grouping responses
function groupBySection(responses: SurveyResponse[]): Record<string, SurveyResponse[]> {
  return responses
    .filter(r => r.triggerType === 'section_completion')
    .reduce((acc, response) => {
      const sectionId = response.triggerContentId.toString();
      if (!acc[sectionId]) {
        acc[sectionId] = [];
      }
      acc[sectionId].push(response);
      return acc;
    }, {} as Record<string, SurveyResponse[]>);
}

function groupByTopic(responses: SurveyResponse[]): Record<string, SurveyResponse[]> {
  return responses.reduce((acc, response) => {
    let topicKey: string;

    if (response.triggerType === 'section_completion') {
      topicKey = response.contentInfo?.topicName || 'Unknown Topic';
    } else {
      topicKey = response.contentInfo?.name || 'Unknown Topic';
    }

    if (!acc[topicKey]) {
      acc[topicKey] = [];
    }
    acc[topicKey].push(response);
    return acc;
  }, {} as Record<string, SurveyResponse[]>);
}

function groupBySubject(responses: SurveyResponse[]): Record<string, SurveyResponse[]> {
  return responses.reduce((acc, response) => {
    const subjectKey = response.contentInfo?.subjectName || 'Unknown Subject';

    if (!acc[subjectKey]) {
      acc[subjectKey] = [];
    }
    acc[subjectKey].push(response);
    return acc;
  }, {} as Record<string, SurveyResponse[]>);
}

// Calculate analytics for a group of responses
function calculateContentAnalytics(responses: SurveyResponse[], survey: Survey) {
  const totalResponses = responses.length;
  const averageTimeSpent = totalResponses > 0
    ? responses.reduce((sum, r) => sum + r.timeSpent, 0) / totalResponses
    : 0;

  // Find rating question
  const ratingQuestion = survey.questions.find(q => q.type === 'rating');
  let averageRating: number | undefined;
  let ratingDistribution: Record<string, number> | undefined;

  if (ratingQuestion) {
    const ratingResponses = responses
      .map(r => r.responses.find(resp => resp.questionId === ratingQuestion.id))
      .filter(Boolean)
      .map(r => Number(r!.answer))
      .filter(r => !isNaN(r));

    if (ratingResponses.length > 0) {
      averageRating = ratingResponses.reduce((sum, r) => sum + r, 0) / ratingResponses.length;

      ratingDistribution = {};
      if (ratingQuestion.scale) {
        for (let i = ratingQuestion.scale.min; i <= ratingQuestion.scale.max; i++) {
          ratingDistribution[i] = ratingResponses.filter(r => r === i).length;
        }
      }
    }
  }

  return {
    totalResponses,
    averageRating,
    averageTimeSpent,
    ratingDistribution,
    responses: responses.map(r => ({
      completedAt: r.completedAt,
      timeSpent: r.timeSpent
    }))
  };
}

// Calculate overall analytics
function calculateOverallAnalytics(responses: SurveyResponse[], survey: Survey) {
  return calculateContentAnalytics(responses, survey);
}