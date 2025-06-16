'use client';

import Link from 'next/link';
import { Crown, BookOpen, Target } from 'lucide-react';

interface NavbarNavigationProps {
  isAuthenticated: boolean;
}

export function NavbarNavigation({ isAuthenticated }: NavbarNavigationProps) {
  if (!isAuthenticated) return null;

  return (
    <div className="hidden lg:flex items-center space-x-1">
      <Link 
        href="/dashboard"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
      >
        <Crown className="h-4 w-4" />
        Dashboard
      </Link>
      <Link 
        href="/subjects"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
      >
        <BookOpen className="h-4 w-4" />
        Study Worlds
      </Link>
      <Link 
        href="/challenges"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
      >
        <Target className="h-4 w-4" />
        Challenges
      </Link>
    </div>
  );
} 