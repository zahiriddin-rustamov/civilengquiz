'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Users, Clock, TrendingUp } from 'lucide-react';
import { RatingDistributionChart } from './RatingDistributionChart';
import { ResponseTimelineChart } from './ResponseTimelineChart';

interface ContentAnalyticsCardProps {
  contentInfo: {
    id: string;
    name: string;
    path: string;
    type: 'Section' | 'Topic' | 'Subject';
  };
  analytics: {
    totalResponses: number;
    averageRating?: number;
    averageTimeSpent: number;
    ratingDistribution?: Record<string, number>;
    responseRate?: number;
    responses: Array<{
      completedAt: Date | string;
      timeSpent: number;
    }>;
  };
  ratingScale?: { min: number; max: number };
  className?: string;
  showTimeline?: boolean;
}

export function ContentAnalyticsCard({
  contentInfo,
  analytics,
  ratingScale = { min: 1, max: 5 },
  className = "",
  showTimeline = true
}: ContentAnalyticsCardProps) {
  const {
    totalResponses,
    averageRating,
    averageTimeSpent,
    ratingDistribution,
    responseRate,
    responses
  } = analytics;

  const hasRatingData = averageRating !== undefined && ratingDistribution;

  // Performance indicators
  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (rating: number) => {
    if (rating >= 4.5) return { label: 'Excellent', variant: 'default' as const, className: 'bg-green-100 text-green-800' };
    if (rating >= 3.5) return { label: 'Good', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Needs Attention', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' };
  };

  // Get theme colors based on content type
  const getThemeColors = (type: string) => {
    switch (type) {
      case 'Section':
        return {
          gradient: 'from-purple-50 to-pink-50/50',
          border: 'border-purple-200/50',
          accent: 'bg-purple-100 text-purple-800'
        };
      case 'Topic':
        return {
          gradient: 'from-emerald-50 to-teal-50/50',
          border: 'border-emerald-200/50',
          accent: 'bg-emerald-100 text-emerald-800'
        };
      case 'Subject':
        return {
          gradient: 'from-amber-50 to-orange-50/50',
          border: 'border-amber-200/50',
          accent: 'bg-amber-100 text-amber-800'
        };
      default:
        return {
          gradient: 'from-slate-50 to-gray-50/50',
          border: 'border-slate-200/50',
          accent: 'bg-slate-100 text-slate-800'
        };
    }
  };

  const theme = getThemeColors(contentInfo.type);

  return (
    <Card className={`${className} bg-gradient-to-br ${theme.gradient} border ${theme.border} hover:shadow-lg transition-all duration-200`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={`text-xs ${theme.accent} border-current`}>
                {contentInfo.type}
              </Badge>
              {hasRatingData && averageRating && (
                <Badge
                  className={`text-xs ${getPerformanceBadge(averageRating).className}`}
                  variant="secondary"
                >
                  {getPerformanceBadge(averageRating).label}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-semibold truncate text-gray-900">
              {contentInfo.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1 truncate">
              {contentInfo.path}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enhanced Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/50 text-center hover:bg-white/80 transition-all">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-gray-900">{totalResponses}</div>
            <div className="text-xs text-gray-600">Responses</div>
          </div>

          {hasRatingData && averageRating && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/50 text-center hover:bg-white/80 transition-all">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
              <div className={`text-xl font-bold ${getPerformanceColor(averageRating)}`}>
                {averageRating.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Avg Rating</div>
            </div>
          )}

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/50 text-center hover:bg-white/80 transition-all">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {Math.round(averageTimeSpent)}s
            </div>
            <div className="text-xs text-gray-600">Avg Time</div>
          </div>

          {responseRate !== undefined && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/50 text-center hover:bg-white/80 transition-all">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-gray-900">
                {Math.round(responseRate)}%
              </div>
              <div className="text-xs text-gray-600">Response Rate</div>
            </div>
          )}
        </div>

        {/* Rating Distribution Chart */}
        {hasRatingData && ratingDistribution && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Rating Distribution
            </h4>
            <RatingDistributionChart
              ratingDistribution={ratingDistribution}
              scale={ratingScale}
            />
          </div>
        )}

        {/* Response Timeline */}
        {showTimeline && responses.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Response Timeline
            </h4>
            <ResponseTimelineChart
              responses={responses}
              days={7}
            />
          </div>
        )}

        {/* Response Rate Progress (if available) */}
        {responseRate !== undefined && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Response Rate</span>
              <span className="font-medium">{Math.round(responseRate)}%</span>
            </div>
            <Progress value={responseRate} className="h-2" />
          </div>
        )}

        {/* No Data State */}
        {totalResponses === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm">No responses yet for this {contentInfo.type.toLowerCase()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}