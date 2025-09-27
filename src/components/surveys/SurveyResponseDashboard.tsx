'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ContentGroupTabs } from './ContentGroupTabs';
import { ContentHierarchyFilter } from './ContentHierarchyFilter';
import { RatingDistributionChart } from './RatingDistributionChart';
import { ResponseTimelineChart } from './ResponseTimelineChart';
import {
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  Download,
  Star,
  Target,
  Activity
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
  description?: string;
  triggerType: 'section_completion' | 'flashcard_completion' | 'media_completion';
  questions: {
    id: string;
    type: 'rating' | 'multiple_choice' | 'text';
    question: string;
    required: boolean;
    options?: string[];
    scale?: { min: number; max: number; labels?: string[] };
  }[];
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

interface SurveyResponseDashboardProps {
  survey: Survey;
  responses: SurveyResponse[];
  onExportResponses: () => void;
  className?: string;
}

export function SurveyResponseDashboard({
  survey,
  responses,
  onExportResponses,
  className = ""
}: SurveyResponseDashboardProps) {
  // Find rating question for filters
  const ratingQuestion = useMemo(() => {
    return survey.questions.find(q => q.type === 'rating' && q.scale);
  }, [survey.questions]);

  // Initialize filters
  const [filters, setFilters] = useState<FilterState>({
    userSearch: '',
    contentSearch: '',
    dateRange: 'all',
    ratingRange: ratingQuestion ? [ratingQuestion.scale!.min, ratingQuestion.scale!.max] : [1, 5],
    completenessFilter: 'all',
    subjectFilter: '',
    topicFilter: '',
    sectionFilter: ''
  });

  // Apply filters to responses
  const filteredResponses = useMemo(() => {
    return responses.filter(response => {
      // User search filter
      if (filters.userSearch.trim()) {
        const searchTerm = filters.userSearch.toLowerCase();
        const matchesUser =
          response.userId.name.toLowerCase().includes(searchTerm) ||
          response.userId.email.toLowerCase().includes(searchTerm);
        if (!matchesUser) return false;
      }

      // Content search filter
      if (filters.contentSearch.trim()) {
        const searchTerm = filters.contentSearch.toLowerCase();
        const matchesContent =
          response.contentInfo?.name.toLowerCase().includes(searchTerm) ||
          response.contentInfo?.path.toLowerCase().includes(searchTerm);
        if (!matchesContent) return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let cutoffDate: Date;

        switch (filters.dateRange) {
          case 'today':
            cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            cutoffDate = new Date(0);
        }

        if (new Date(response.completedAt) < cutoffDate) return false;
      }


      // Content hierarchy filters
      if (filters.subjectFilter && response.contentInfo?.subjectName !== filters.subjectFilter) {
        return false;
      }

      if (filters.topicFilter) {
        const topicName = response.contentInfo?.topicName || response.contentInfo?.name;
        if (topicName !== filters.topicFilter) {
          return false;
        }
      }

      if (filters.sectionFilter && response.contentInfo?.name !== filters.sectionFilter) {
        return false;
      }

      // Rating range filter
      if (ratingQuestion && filters.ratingRange) {
        const ratingResponse = response.responses.find(r => r.questionId === ratingQuestion.id);
        if (ratingResponse) {
          const rating = Number(ratingResponse.answer);
          if (!isNaN(rating) && (rating < filters.ratingRange[0] || rating > filters.ratingRange[1])) {
            return false;
          }
        }
      }

      // Response completeness filter
      if (filters.completenessFilter !== 'all') {
        const isComplete = response.responses.length === survey.questions.length;
        if (filters.completenessFilter === 'complete' && !isComplete) {
          return false;
        }
        if (filters.completenessFilter === 'partial' && isComplete) {
          return false;
        }
      }

      return true;
    });
  }, [responses, filters, survey.questions.length, ratingQuestion]);

  // Calculate dashboard analytics
  const dashboardAnalytics = useMemo(() => {
    const totalResponses = filteredResponses.length;
    const averageTimeSpent = totalResponses > 0
      ? filteredResponses.reduce((sum, r) => sum + r.timeSpent, 0) / totalResponses
      : 0;

    let overallRating = 0;
    let ratingDistribution: Record<string, number> = {};
    let responseRate = 0;

    if (ratingQuestion) {
      const ratingResponses = filteredResponses
        .map(r => r.responses.find(resp => resp.questionId === ratingQuestion.id))
        .filter(Boolean)
        .map(r => Number(r!.answer))
        .filter(r => !isNaN(r));

      if (ratingResponses.length > 0) {
        overallRating = ratingResponses.reduce((sum, r) => sum + r, 0) / ratingResponses.length;

        // Initialize rating distribution
        for (let i = ratingQuestion.scale!.min; i <= ratingQuestion.scale!.max; i++) {
          ratingDistribution[i] = ratingResponses.filter(r => r === i).length;
        }

        responseRate = (ratingResponses.length / totalResponses) * 100;
      }
    }

    // Content coverage metrics
    const uniqueSubjects = new Set(filteredResponses.map(r => r.contentInfo?.subjectName).filter(Boolean)).size;
    const uniqueTopics = new Set(
      filteredResponses.map(r => r.contentInfo?.topicName || r.contentInfo?.name).filter(Boolean)
    ).size;
    const uniqueSections = new Set(
      filteredResponses.filter(r => r.triggerType === 'section_completion')
        .map(r => r.contentInfo?.name).filter(Boolean)
    ).size;

    return {
      totalResponses,
      averageTimeSpent,
      overallRating,
      ratingDistribution,
      responseRate,
      contentCoverage: {
        subjects: uniqueSubjects,
        topics: uniqueTopics,
        sections: uniqueSections
      }
    };
  }, [filteredResponses, ratingQuestion]);

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (rating: number) => {
    if (rating >= 4.5) return { label: 'Excellent', className: 'bg-green-100 text-green-800' };
    if (rating >= 3.5) return { label: 'Good', className: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Needs Attention', className: 'bg-red-100 text-red-800' };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Dashboard Overview */}
      <Card className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 border-indigo-200/50">
        <CardHeader className="bg-white/60 backdrop-blur-sm border-b border-white/50 pt-5">
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            Survey Performance Overview
          </CardTitle>
          <CardDescription className="text-indigo-700">
            Key metrics and insights for {survey.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Responses */}
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-5 rounded-xl border border-blue-300/50 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Users className="h-6 w-6 text-white" />
                </div>
                {responses.length !== filteredResponses.length && (
                  <Badge variant="outline" className="text-xs bg-white/50">
                    Filtered
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-1">
                {dashboardAnalytics.totalResponses}
              </div>
              <div className="text-sm font-medium text-blue-700">Total Responses</div>
              {responses.length !== filteredResponses.length && (
                <div className="text-xs text-blue-600 mt-1">
                  of {responses.length} total
                </div>
              )}
            </div>

            {/* Average Rating */}
            {ratingQuestion && dashboardAnalytics.overallRating > 0 && (
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-5 rounded-xl border border-yellow-300/50 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <Badge
                    className={`text-xs ${getPerformanceBadge(dashboardAnalytics.overallRating).className} border-0`}
                    variant="secondary"
                  >
                    {getPerformanceBadge(dashboardAnalytics.overallRating).label}
                  </Badge>
                </div>
                <div className={`text-3xl font-bold mb-1 ${getPerformanceColor(dashboardAnalytics.overallRating)}`}>
                  {dashboardAnalytics.overallRating.toFixed(1)}
                </div>
                <div className="text-sm font-medium text-yellow-700">Average Rating</div>
              </div>
            )}

            {/* Average Time */}
            <div className="bg-gradient-to-br from-green-100 to-green-200 p-5 rounded-xl border border-green-300/50 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-green-900 mb-1">
                {Math.round(dashboardAnalytics.averageTimeSpent)}s
              </div>
              <div className="text-sm font-medium text-green-700">Avg Time Spent</div>
              <div className="text-xs text-green-600 mt-1">
                {(dashboardAnalytics.averageTimeSpent / 60).toFixed(1)} minutes
              </div>
            </div>

            {/* Content Coverage */}
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-5 rounded-xl border border-purple-300/50 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-900 mb-1">
                {dashboardAnalytics.contentCoverage.subjects + dashboardAnalytics.contentCoverage.topics + dashboardAnalytics.contentCoverage.sections}
              </div>
              <div className="text-sm font-medium text-purple-700">Content Areas</div>
              <div className="text-xs text-purple-600 mt-1">
                {dashboardAnalytics.contentCoverage.subjects}S • {dashboardAnalytics.contentCoverage.topics}T • {dashboardAnalytics.contentCoverage.sections}Sec
              </div>
            </div>
          </div>

          {/* Visual Analytics Row */}
          {ratingQuestion && Object.keys(dashboardAnalytics.ratingDistribution).length > 0 && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Overall Rating Distribution</h4>
                <RatingDistributionChart
                  ratingDistribution={dashboardAnalytics.ratingDistribution}
                  scale={ratingQuestion.scale!}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Response Timeline (Last 7 Days)</h4>
                <ResponseTimelineChart
                  responses={filteredResponses.map(r => ({
                    completedAt: r.completedAt
                  }))}
                  days={7}
                />
              </div>
            </div>
          )}

          {/* Response Rate Progress */}
          {ratingQuestion && dashboardAnalytics.responseRate > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Rating Question Response Rate</span>
                <span className="font-medium">{Math.round(dashboardAnalytics.responseRate)}%</span>
              </div>
              <Progress value={dashboardAnalytics.responseRate} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Filtering */}
      <ContentHierarchyFilter
        responses={responses}
        filters={filters}
        onFiltersChange={setFilters}
        ratingQuestion={ratingQuestion}
      />

      {/* Results Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">
                  Showing {filteredResponses.length} of {responses.length} responses
                </span>
              </div>
              {responses.length !== filteredResponses.length && (
                <Badge variant="outline" className="text-xs">
                  Filtered
                </Badge>
              )}
            </div>
            <Button
              onClick={onExportResponses}
              disabled={filteredResponses.length === 0}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Filtered Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Group Tabs */}
      <ContentGroupTabs
        responses={filteredResponses}
        survey={survey}
      />
    </div>
  );
}