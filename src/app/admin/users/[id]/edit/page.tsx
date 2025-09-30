'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';

interface UserFormData {
  name: string;
  email: string;
  role: 'student' | 'admin';
  isVerified: boolean;
  password: string;
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'student',
    isVerified: false,
    password: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setFormData({
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        isVerified: data.user.isVerified,
        password: ''
      });
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

      // Build update payload - only include password if it's not empty
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isVerified: formData.isVerified
      };

      if (formData.password && formData.password.length > 0) {
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsSaving(false);
          return;
        }
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      router.push(`/admin/users/${userId}`);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/admin/users/${userId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/admin/users/${userId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to User
          </Link>
        </Button>
      </div>

      {/* Edit Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
          <CardDescription>
            Update user information and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                placeholder="Enter user name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                placeholder="Enter email address"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value: 'student' | 'admin') => handleChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Admins have full access to the admin panel
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Leave blank to keep current password"
              />
              <p className="text-sm text-gray-500">
                Only fill this in if you want to change the user's password (min 6 characters)
              </p>
            </div>

            {/* Email Verification */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="isVerified">Email Verified</Label>
                <p className="text-sm text-gray-500">
                  Allow user to access the platform
                </p>
              </div>
              <Switch
                id="isVerified"
                checked={formData.isVerified}
                onCheckedChange={(checked) => handleChange('isVerified', checked)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/users/${userId}`)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="max-w-2xl bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p>• Changing the email will require the user to verify the new email address</p>
          <p>• Admin users have full access to all admin panel features</p>
          <p>• Unverified users cannot log in to the platform</p>
        </CardContent>
      </Card>
    </div>
  );
}