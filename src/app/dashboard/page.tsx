'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CharacterPanel } from '@/components/dashboard/CharacterPanel';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { SubjectSkillTrees } from '@/components/dashboard/SubjectSkillTrees';
import { AchievementsSidebar } from '@/components/dashboard/AchievementsSidebar';
import { ProgressSummary } from '@/components/dashboard/ProgressSummary';
import { DashboardProvider } from '@/context/DashboardProvider';

export default function DashboardPage() {
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
          <p className="text-indigo-600 font-medium">Loading your study adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="container mx-auto px-4 py-6">
          {/* Character Panel - Top Section */}
          <div className="mb-6">
            <CharacterPanel />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Column - Main Content */}
            <div className="xl:col-span-3 space-y-6">
              {/* Quick Actions */}
              <QuickActions />
              
              {/* Subject Skill Trees */}
              <SubjectSkillTrees />
            </div>

            {/* Right Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              <AchievementsSidebar />
            </div>
          </div>

          {/* Progress Summary - Bottom Section */}
          <div className="mt-6">
            <ProgressSummary />
          </div>
        </div>
      </div>
    </DashboardProvider>
  );
} 