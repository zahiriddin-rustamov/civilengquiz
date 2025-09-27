'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Filter, X, Search, Star, Calendar } from 'lucide-react';
import { Types } from 'mongoose';

interface SurveyResponse {
  _id: Types.ObjectId;
  triggerType: string;
  completedAt: Date;
  responses: {
    questionId: string;
    answer: any;
  }[];
  userId: {
    name: string;
    email: string;
  };
  contentInfo?: {
    type: string;
    name: string;
    topicName?: string;
    subjectName?: string;
    path: string;
  };
}

interface FilterState {
  userSearch: string;
  contentSearch: string;
  dateRange: string;
  ratingRange: number[];
  completenessFilter: string;
  subjectFilter: string;
  topicFilter: string;
  sectionFilter: string;
}

interface ContentHierarchyFilterProps {
  responses: SurveyResponse[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  ratingQuestion?: {
    id: string;
    scale: { min: number; max: number };
  };
  className?: string;
}

export function ContentHierarchyFilter({
  responses,
  filters,
  onFiltersChange,
  ratingQuestion,
  className = ""
}: ContentHierarchyFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract unique values for hierarchy filters
  const uniqueSubjects = Array.from(
    new Set(responses.map(r => r.contentInfo?.subjectName).filter(Boolean))
  ).sort();

  const uniqueTopics = Array.from(
    new Set(
      responses
        .filter(r => !filters.subjectFilter || r.contentInfo?.subjectName === filters.subjectFilter)
        .map(r => r.contentInfo?.topicName || r.contentInfo?.name)
        .filter(Boolean)
    )
  ).sort();

  const uniqueSections = Array.from(
    new Set(
      responses
        .filter(r => r.triggerType === 'section_completion')
        .filter(r => !filters.subjectFilter || r.contentInfo?.subjectName === filters.subjectFilter)
        .filter(r => !filters.topicFilter || r.contentInfo?.topicName === filters.topicFilter)
        .map(r => r.contentInfo?.name)
        .filter(Boolean)
    )
  ).sort();

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };

    // Clear dependent filters when parent changes
    if (key === 'subjectFilter') {
      newFilters.topicFilter = '';
      newFilters.sectionFilter = '';
    } else if (key === 'topicFilter') {
      newFilters.sectionFilter = '';
    }

    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({
      userSearch: '',
      contentSearch: '',
      dateRange: 'all',
      ratingRange: ratingQuestion ? [ratingQuestion.scale.min, ratingQuestion.scale.max] : [1, 5],
      completenessFilter: 'all',
      subjectFilter: '',
      topicFilter: '',
      sectionFilter: ''
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.userSearch.trim()) count++;
    if (filters.contentSearch.trim()) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.completenessFilter !== 'all') count++;
    if (filters.subjectFilter) count++;
    if (filters.topicFilter) count++;
    if (filters.sectionFilter) count++;
    if (ratingQuestion && (
      filters.ratingRange[0] !== ratingQuestion.scale.min ||
      filters.ratingRange[1] !== ratingQuestion.scale.max
    )) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Advanced Filters</CardTitle>
            {activeCount > 0 && (
              <Badge variant="secondary">{activeCount} active</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2 text-xs"
            >
              {isExpanded ? 'Less' : 'More'} filters
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Filters - Always Visible */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="userSearch" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Search Users
            </Label>
            <Input
              id="userSearch"
              placeholder="Name or email..."
              value={filters.userSearch}
              onChange={(e) => updateFilter('userSearch', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentSearch" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Search Content
            </Label>
            <Input
              id="contentSearch"
              placeholder="Section or topic name..."
              value={filters.contentSearch}
              onChange={(e) => updateFilter('contentSearch', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateRange" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date Range
            </Label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => updateFilter('dateRange', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters - Expandable */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t">
            {/* Content Hierarchy */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Content Hierarchy</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="subjectFilter">Subject</Label>
                  <Select
                    value={filters.subjectFilter}
                    onValueChange={(value) => updateFilter('subjectFilter', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All subjects</SelectItem>
                      {uniqueSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topicFilter">Topic</Label>
                  <Select
                    value={filters.topicFilter}
                    onValueChange={(value) => updateFilter('topicFilter', value)}
                    disabled={!filters.subjectFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All topics</SelectItem>
                      {uniqueTopics.map((topic) => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sectionFilter">Section</Label>
                  <Select
                    value={filters.sectionFilter}
                    onValueChange={(value) => updateFilter('sectionFilter', value)}
                    disabled={!filters.topicFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All sections</SelectItem>
                      {uniqueSections.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Rating Range Filter */}
            {ratingQuestion && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Rating Range
                </h4>
                <div className="space-y-3">
                  <Slider
                    value={filters.ratingRange}
                    onValueChange={(value) => updateFilter('ratingRange', value)}
                    min={ratingQuestion.scale.min}
                    max={ratingQuestion.scale.max}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{filters.ratingRange[0]} stars</span>
                    <span>to {filters.ratingRange[1]} stars</span>
                  </div>
                </div>
              </div>
            )}

            {/* Response Completeness */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Response Completeness</h4>
              <Select
                value={filters.completenessFilter}
                onValueChange={(value) => updateFilter('completenessFilter', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All responses</SelectItem>
                  <SelectItem value="complete">Complete responses only</SelectItem>
                  <SelectItem value="partial">Partial responses only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Advanced filtering with content hierarchy navigation
            </span>
            {activeCount > 0 && (
              <span className="text-blue-600">
                {activeCount} filter{activeCount > 1 ? 's' : ''} applied
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}