'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  ArrowLeft,
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  Users,
  Brain,
  FileText,
  CreditCard,
  Play,
  ChevronRight
} from 'lucide-react';

interface TopicMetrics {
  topicId: string;
  topicName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  avgTime: number;
  firstTryAccuracy: number;
  retryRate: number;
  completionRate: number;
  contentCounts: {
    questions: number;
    flashcards: number;
    videos: number;
  };
}

interface LearningPattern {
  pattern: string;
  count: number;
  avgAccuracy: number;
  description: string;
}

interface SubjectAnalytics {
  subject: {
    id: string;
    name: string;
    description?: string;
  };
  topics: TopicMetrics[];
  learningPatterns: LearningPattern[];
  timeDistribution: {
    consistent: number;
    cramming: number;
    sporadic: number;
  };
  dateRange: {
    from: string;
    to: string;
    days: number;
  };
}

export default function SubjectAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<SubjectAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);

  const subjectId = params.id as string;

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
      const response = await fetch(`/api/admin/analytics/subjects/${subjectId}?days=${selectedDays}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return 'text-green-600';
    if (accuracy >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analytics
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analytics
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No Analytics Data</h3>
          <p className="mt-1 text-sm text-gray-500">Unable to load analytics for this subject.</p>
        </div>
      </div>
    );
  }

  const successfulPattern = analytics.learningPatterns[0]; // Sorted by accuracy
  const totalStudents = analytics.timeDistribution.consistent +
                       analytics.timeDistribution.cramming +
                       analytics.timeDistribution.sporadic;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analytics
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{analytics.subject.name}</h1>
            <p className="text-gray-600">Topic performance analysis</p>
          </div>
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg"
          value={selectedDays}
          onChange={(e) => setSelectedDays(parseInt(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{analytics.topics.length}</div>
            <p className="text-xs text-gray-500">In this subject</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(
                analytics.topics.reduce((sum, t) => sum + t.firstTryAccuracy, 0) /
                  (analytics.topics.length || 1)
              )}%
            </div>
            <p className="text-xs text-gray-500">First attempt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Study Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.timeDistribution.consistent > analytics.timeDistribution.cramming
                ? 'Consistent'
                : 'Cramming'}
            </div>
            <p className="text-xs text-gray-500">Most common</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Best Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900">{successfulPattern?.pattern || 'N/A'}</div>
            <p className="text-xs text-gray-500">{successfulPattern?.avgAccuracy || 0}% accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Topic Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Topic Performance Matrix
          </CardTitle>
          <CardDescription>
            Detailed metrics for each topic showing difficulty and student performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topic</TableHead>
                <TableHead className="text-center">Difficulty</TableHead>
                <TableHead className="text-center">Avg Time</TableHead>
                <TableHead className="text-center">First-Try %</TableHead>
                <TableHead className="text-center">Retry Rate</TableHead>
                <TableHead className="text-center">Completion</TableHead>
                <TableHead className="text-center">Content</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.topics.map((topic) => (
                <TableRow key={topic.topicId}>
                  <TableCell className="font-medium">{topic.topicName}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getDifficultyColor(topic.difficulty)}`}>
                      {topic.difficulty}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {topic.avgTime} min
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-semibold ${getAccuracyColor(topic.firstTryAccuracy)}`}>
                      {topic.firstTryAccuracy}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={topic.retryRate > 50 ? 'text-red-600 font-semibold' : ''}>
                      {topic.retryRate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${topic.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm">{topic.completionRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2 text-xs">
                      {topic.contentCounts.questions > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {topic.contentCounts.questions}
                        </span>
                      )}
                      {topic.contentCounts.flashcards > 0 && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {topic.contentCounts.flashcards}
                        </span>
                      )}
                      {topic.contentCounts.videos > 0 && (
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          {topic.contentCounts.videos}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Problem Topics Alert */}
          {analytics.topics.some(t => t.firstTryAccuracy < 50 || t.retryRate > 60) && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Topics Requiring Attention</h4>
                  <ul className="mt-1 text-sm text-red-700">
                    {analytics.topics
                      .filter(t => t.firstTryAccuracy < 50 || t.retryRate > 60)
                      .map(t => (
                        <li key={t.topicId}>
                          • {t.topicName}: {t.firstTryAccuracy}% accuracy, {t.retryRate}% retry rate
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Learning Pattern Analysis
            </CardTitle>
            <CardDescription>How students approach content in this subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.learningPatterns.map((pattern, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    index === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{pattern.pattern}</span>
                    <span className={`font-semibold ${getAccuracyColor(pattern.avgAccuracy)}`}>
                      {pattern.avgAccuracy}% accuracy
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{pattern.description}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Used by {pattern.count} student{pattern.count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time Distribution
            </CardTitle>
            <CardDescription>Study patterns across students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Consistent Study</span>
                  <span className="text-sm text-gray-600">
                    {analytics.timeDistribution.consistent} students
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600"
                    style={{
                      width: `${
                        totalStudents > 0
                          ? (analytics.timeDistribution.consistent / totalStudents) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Regular daily study sessions</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Cramming</span>
                  <span className="text-sm text-gray-600">
                    {analytics.timeDistribution.cramming} students
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-600"
                    style={{
                      width: `${
                        totalStudents > 0
                          ? (analytics.timeDistribution.cramming / totalStudents) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Intensive study in short periods</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Sporadic</span>
                  <span className="text-sm text-gray-600">
                    {analytics.timeDistribution.sporadic} students
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600"
                    style={{
                      width: `${
                        totalStudents > 0
                          ? (analytics.timeDistribution.sporadic / totalStudents) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Irregular study patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}