'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  ArrowLeft,
  Edit,
  Trash2,
  Shield,
  GraduationCap,
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
  Clock,
  Activity,
  BookOpen,
  CreditCard,
  Play,
  FileText,
  Calendar,
  Mail,
  User as UserIcon
} from 'lucide-react';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  isVerified: boolean;
  level: number;
  totalXP: number;
  currentStreak: number;
  maxStreak: number;
  learningStreak: number;
  lastLearningDate?: string;
  showOnLeaderboard: boolean;
  achievements: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProgressByType {
  _id: string;
  totalCompleted: number;
  totalAttempts: number;
  totalXPEarned: number;
  totalTimeSpent: number;
}

interface SubjectProgress {
  _id: string;
  totalCompleted: number;
  totalAttempts: number;
  averageScore: number;
  subject: {
    name: string;
  };
}

interface RecentActivity {
  totalSessions: number;
  totalDuration: number;
  totalActiveDuration: number;
}

interface Session {
  _id: string;
  startTime: string;
  endTime?: string;
  duration: number;
  activeDuration: number;
}

interface DetailedUser {
  user: UserData;
  stats: {
    progressByType: ProgressByType[];
    progressBySubject: SubjectProgress[];
    recentActivity: RecentActivity;
  };
  recentSessions: Session[];
  recentInteractions: any[];
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [userData, setUserData] = useState<DetailedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUserData(data);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone and will delete all associated data.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete user');

      router.push('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <FileText className="w-4 h-4" />;
      case 'flashcard': return <CreditCard className="w-4 h-4" />;
      case 'media': return <Play className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              {error || 'User not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, stats, recentSessions } = userData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Link>
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/users/${userId}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Link>
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete User
          </Button>
        </div>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                    {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <GraduationCap className="w-3 h-3 mr-1" />}
                    {user.role}
                  </Badge>
                  {user.isVerified ? (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      <XCircle className="w-3 h-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Joined</div>
                <div className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Level</div>
                <div className="font-medium">Level {user.level || 0}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Total XP</div>
                <div className="font-medium">{(user.totalXP || 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Achievements</div>
                <div className="font-medium">{user.achievements?.length || 0}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">🔥 {user.currentStreak || 0} days</div>
            <p className="text-xs text-gray-500 mt-1">Max: {user.maxStreak || 0} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Learning Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">📚 {user.learningStreak || 0} days</div>
            <p className="text-xs text-gray-500 mt-1">
              Last: {user.lastLearningDate ? new Date(user.lastLearningDate).toLocaleDateString() : 'Never'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Recent Activity (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.recentActivity?.totalSessions || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {formatDuration(stats?.recentActivity?.totalActiveDuration || 0)} active time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress by Content Type */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Content Type</CardTitle>
          <CardDescription>Learning activity breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!stats?.progressByType || stats.progressByType.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No activity yet</div>
            ) : (
              stats.progressByType.map((progress) => (
                <div key={progress._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getContentTypeIcon(progress._id)}
                    <div>
                      <div className="font-medium capitalize">{progress._id}</div>
                      <div className="text-sm text-gray-500">
                        {progress.totalCompleted || 0} completed • {progress.totalAttempts || 0} attempts
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-600">{progress.totalXPEarned || 0} XP</div>
                    <div className="text-sm text-gray-500">{formatDuration(progress.totalTimeSpent || 0)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress by Subject */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Subject</CardTitle>
          <CardDescription>Performance across different subjects</CardDescription>
        </CardHeader>
        <CardContent>
          {!stats?.progressBySubject || stats.progressBySubject.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No subject progress yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">Attempts</TableHead>
                  <TableHead className="text-center">Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.progressBySubject.map((subj) => (
                  <TableRow key={subj._id}>
                    <TableCell className="font-medium">{subj.subject?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-center">{subj.totalCompleted || 0}</TableCell>
                    <TableCell className="text-center">{subj.totalAttempts || 0}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${(subj.averageScore || 0) >= 70 ? 'text-green-600' : (subj.averageScore || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {Math.round(subj.averageScore || 0)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Last 10 learning sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {!recentSessions || recentSessions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No sessions yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Active Time</TableHead>
                  <TableHead>Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSessions.map((session) => {
                  const engagementRate = (session.duration || 0) > 0
                    ? Math.round(((session.activeDuration || 0) / session.duration) * 100)
                    : 0;

                  return (
                    <TableRow key={session._id}>
                      <TableCell>{formatDate(session.startTime)}</TableCell>
                      <TableCell>{formatDuration(session.duration || 0)}</TableCell>
                      <TableCell>{formatDuration(session.activeDuration || 0)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                engagementRate >= 70 ? 'bg-green-500' :
                                engagementRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${engagementRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{engagementRate}%</span>
                        </div>
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