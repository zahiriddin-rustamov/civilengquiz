'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BookOpen,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  Target,
  Brain,
  Download,
  ChevronRight,
  Activity
} from 'lucide-react';

interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  activeStudents: number;
  engagementGroups: {
    high: number;
    medium: number;
    low: number;
  };
  firstAttemptAccuracy: number;
  completionRate: number;
  totalInteractions: number;
}

interface AnalyticsData {
  subjects: SubjectAnalytics[];
  insights: string[];
  overall: {
    totalActiveUsers: number;
    totalInteractions: number;
    totalSessions: number;
    averageSessionDuration: number;
  };
  dateRange: {
    from: string;
    to: string;
    days: number;
  };
}

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'admin') {
      router.push('/admin');
      return;
    }
    fetchAnalytics();
  }, [session, status, router, selectedDays]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/analytics/overview?days=${selectedDays}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEngagementColor = (accuracy: number) => {
    if (accuracy >= 70) return 'text-green-600';
    if (accuracy >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEngagementBadge = (groups: { high: number; medium: number; low: number }) => {
    const total = groups.high + groups.medium + groups.low;
    if (total === 0) return null;

    return (
      <div className="flex gap-1 text-xs">
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">
          H: {groups.high}
        </span>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md font-medium">
          M: {groups.medium}
        </span>
        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md font-medium">
          L: {groups.low}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning Analytics</h1>
            <p className="text-gray-600">Research-focused student performance metrics</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No Analytics Data</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Analytics</h1>
          <p className="text-gray-600">Research-focused student performance metrics</p>
        </div>
        <div className="flex gap-3">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg"
            value={selectedDays}
            onChange={(e) => setSelectedDays(parseInt(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Link href="/admin/analytics/export">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export for Research
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{analyticsData.overall.totalActiveUsers}</div>
            <p className="text-xs text-gray-500">In last {selectedDays} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{analyticsData.overall.totalSessions}</div>
            <p className="text-xs text-gray-500">Avg {analyticsData.overall.averageSessionDuration} min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.overall.totalInteractions.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">Total tracked events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(
                analyticsData.subjects.reduce((sum, s) => sum + s.firstAttemptAccuracy, 0) /
                  (analyticsData.subjects.length || 1)
              )}%
            </div>
            <p className="text-xs text-gray-500">First attempt</p>
          </CardContent>
        </Card>
      </div>

      {/* Research Insights */}
      {analyticsData.insights.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Research Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analyticsData.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Subject Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Subject Performance Overview
            </span>
            <Link href="/admin/analytics/students">
              <Button variant="ghost" size="sm">
                View Student Analysis
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardTitle>
          <CardDescription>
            Performance metrics grouped by subject with engagement levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Active Students</TableHead>
                <TableHead>Engagement Groups</TableHead>
                <TableHead className="text-center">First-Try Accuracy</TableHead>
                <TableHead className="text-center">Completion Rate</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyticsData.subjects.map((subject) => (
                <TableRow key={subject.subjectId}>
                  <TableCell className="font-medium">{subject.subjectName}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      {subject.activeStudents}
                    </div>
                  </TableCell>
                  <TableCell>{getEngagementBadge(subject.engagementGroups)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-semibold ${getEngagementColor(subject.firstAttemptAccuracy)}`}>
                      {subject.firstAttemptAccuracy}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${subject.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{subject.completionRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Link href={`/admin/analytics/subject/${subject.subjectId}`}>
                      <Button variant="ghost" size="sm">
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/analytics/students">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-600" />
                Student Analysis
              </CardTitle>
              <CardDescription>View individual student performance and cohorts</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/analytics/export">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="w-5 h-5 text-green-600" />
                Export Data
              </CardTitle>
              <CardDescription>Export data for statistical analysis</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-purple-600" />
              Real-time Monitor
            </CardTitle>
            <CardDescription>Coming soon: Live activity monitoring</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}