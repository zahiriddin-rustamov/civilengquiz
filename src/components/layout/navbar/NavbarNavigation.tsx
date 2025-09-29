'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Crown, BookOpen, Trophy } from 'lucide-react';

interface NavbarNavigationProps {
  isAuthenticated: boolean;
}

export function NavbarNavigation({ isAuthenticated }: NavbarNavigationProps) {
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  const isActive = (path: string) => {
    if (path === '/subjects') {
      return pathname.startsWith('/subjects');
    }
    return pathname === path;
  };

  const getLinkClassName = (path: string) => {
    const baseClasses = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
    const activeClasses = "bg-indigo-100 text-indigo-700";
    const inactiveClasses = "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600";

    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="hidden lg:flex items-center space-x-1">
      <Link
        href="/dashboard"
        className={getLinkClassName('/dashboard')}
      >
        <Crown className="h-4 w-4" />
        Dashboard
      </Link>
      <Link
        href="/subjects"
        className={getLinkClassName('/subjects')}
      >
        <BookOpen className="h-4 w-4" />
        Study Worlds
      </Link>
      <Link
        href="/leaderboard"
        className={getLinkClassName('/leaderboard')}
      >
        <Trophy className="h-4 w-4" />
        Leaderboard
      </Link>
    </div>
  );
} 