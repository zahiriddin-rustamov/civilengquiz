'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Search,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Shield,
  GraduationCap,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

interface UserStats {
  completedContent: number;
  totalAttempts: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  isVerified: boolean;
  level: number;
  totalXP: number;
  currentStreak: number;
  learningStreak: number;
  showOnLeaderboard: boolean;
  createdAt: string;
  lastActiveDate?: string;
  stats: UserStats;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 50,
    pages: 1
  });

  // Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAdmins: 0,
    verifiedUsers: 0,
    activeUsers: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [sortBy, sortOrder, pagination.page]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (verifiedFilter !== 'all') params.append('verified', verifiedFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
      setFilteredUsers(data.users);
      setPagination(data.pagination);

      // Calculate stats
      calculateStats(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (userList: User[]) => {
    if (!userList || userList.length === 0) {
      setStats({
        totalUsers: 0,
        totalStudents: 0,
        totalAdmins: 0,
        verifiedUsers: 0,
        activeUsers: 0
      });
      return;
    }

    const totalUsers = userList.length;
    const totalStudents = userList.filter(u => u.role === 'student').length;
    const totalAdmins = userList.filter(u => u.role === 'admin').length;
    const verifiedUsers = userList.filter(u => u.isVerified).length;

    // Users active in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = userList.filter(u =>
      u.lastActiveDate && new Date(u.lastActiveDate) >= sevenDaysAgo
    ).length;

    setStats({
      totalUsers,
      totalStudents,
      totalAdmins,
      verifiedUsers,
      activeUsers
    });
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u._id)));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user');
      return;
    }
    setBulkAction(action);
    setShowBulkDialog(true);
  };

  const executeBulkAction = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          userIds: Array.from(selectedUsers)
        })
      });

      if (!response.ok) throw new Error('Bulk action failed');

      setShowBulkDialog(false);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Error executing bulk action:', error);
      alert('Failed to execute bulk action');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone and will delete all associated data.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete user');

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getActivityBadge = (lastActive?: string) => {
    if (!lastActive) return <Badge variant="outline" className="bg-gray-100 text-gray-600">Inactive</Badge>;

    const daysSince = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince <= 1) return <Badge className="bg-green-100 text-green-700">Active Today</Badge>;
    if (daysSince <= 7) return <Badge className="bg-blue-100 text-blue-700">Active This Week</Badge>;
    if (daysSince <= 30) return <Badge className="bg-yellow-100 text-yellow-700">Active This Month</Badge>;
    return <Badge variant="outline" className="bg-gray-100 text-gray-600">Inactive</Badge>;
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage student and admin accounts</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage student and admin accounts</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{pagination?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalAdmins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verifiedUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Active (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.activeUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                {filteredUsers?.length || 0} users displayed
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); fetchUsers(); }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>

              {/* Verification Filter */}
              <Select value={verifiedFilter} onValueChange={(val) => { setVerifiedFilter(val); fetchUsers(); }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="true">Verified</SelectItem>
                  <SelectItem value="false">Unverified</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Registration Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="totalXP">Total XP</SelectItem>
                  <SelectItem value="level">Level</SelectItem>
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8 w-64"
                />
              </div>
              <Button onClick={handleSearch} size="sm">Search</Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.size} user(s) selected
              </span>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('bulk_verify')}>
                <UserCheck className="w-4 h-4 mr-1" />
                Verify Selected
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('bulk_unverify')}>
                <UserX className="w-4 h-4 mr-1" />
                Unverify Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('bulk_delete')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Level/XP</TableHead>
                <TableHead>Streaks</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user._id)}
                      onCheckedChange={() => handleSelectUser(user._id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                      {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <GraduationCap className="w-3 h-3 mr-1" />}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Level {user.level || 0}
                      </div>
                      <div className="text-gray-500">{(user.totalXP || 0).toLocaleString()} XP</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>🔥 {user.currentStreak || 0}d</div>
                      <div className="text-gray-500">📚 {user.learningStreak || 0}d</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getActivityBadge(user.lastActiveDate)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/users/${user._id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/users/${user._id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkAction.replace('bulk_', '')} {selectedUsers.size} user(s)?
              {bulkAction === 'bulk_delete' && ' This action cannot be undone and will delete all associated user data.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}