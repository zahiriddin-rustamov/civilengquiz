'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Building, Mail, User, Calendar, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      setIsLoading(false);
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const user = session?.user;
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Account Profile</h1>
          </div>
          <p className="text-gray-600">View your account information</p>
        </div>

        {/* Profile Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header with Avatar */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 p-8 text-white">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-4xl font-bold shadow-lg">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">{user?.name || 'Student'}</h2>
                  <p className="text-indigo-100">UAEU Civil Engineering Student</p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="p-8 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>

              {/* Name */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-base text-gray-900 mt-1">{user?.name || 'N/A'}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-500">Email Address</label>
                  <p className="text-base text-gray-900 mt-1">{user?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-base text-gray-900 mt-1 capitalize">
                    {user?.role || 'Student'}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-500">Member Since</label>
                  <p className="text-base text-gray-900 mt-1">{memberSince}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Need to reset your password? Use the "Forgot Password" option on the login page.</p>
          </div>
        </div>
      </div>
    </div>
  );
}