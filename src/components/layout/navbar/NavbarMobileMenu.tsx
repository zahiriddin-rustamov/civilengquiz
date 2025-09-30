'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  X,
  BookOpen,
  BarChart3,
  Trophy,
  Crown,
  Settings
} from 'lucide-react';
import type { Session } from 'next-auth';

interface NavbarMobileMenuProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  session?: Session | null;
  firstName?: string;
}

export function NavbarMobileMenu({
  isMenuOpen,
  setIsMenuOpen,
  isAuthenticated,
  session,
  firstName
}: NavbarMobileMenuProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/subjects') {
      return pathname.startsWith('/subjects');
    }
    return pathname === path;
  };

  const getMobileLinkClassName = (path: string) => {
    const baseClasses = "flex w-full items-center gap-3 rounded-lg p-3 transition-colors";
    const activeClasses = "bg-indigo-100 text-indigo-700";
    const inactiveClasses = "hover:bg-indigo-50";

    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div 
          className="lg:hidden border-t border-indigo-100"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="container mx-auto px-4 py-4 bg-gradient-to-b from-indigo-50/50 to-white">
            {isAuthenticated && firstName ? (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                {/* Gaming Profile Card - Mobile */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 rounded-xl p-4 text-white mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      {firstName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{firstName}</div>
                      <div className="text-indigo-100 text-sm">Civil Engineering Student</div>
                    </div>
                  </div>
                </div>

                {/* Gaming Navigation Links */}
                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    className={getMobileLinkClassName('/dashboard')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Crown className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium">Gaming Dashboard</span>
                  </Link>
                  <Link
                    href="/subjects"
                    className={getMobileLinkClassName('/subjects')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Study Worlds</span>
                  </Link>
                  <Link
                    href="/leaderboard"
                    className={getMobileLinkClassName('/leaderboard')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">Leaderboard</span>
                  </Link>
                  <Link
                    href="/achievements"
                    className={getMobileLinkClassName('/achievements')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">Achievements</span>
                  </Link>
                </div>

                {/* Account Section */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-600 px-3">Account</h3>
                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">Profile</span>
                    </Link>
                    {session?.user?.role === 'admin' && (
                      <Link 
                        href="/admin"
                        className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">Admin Portal</span>
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        signOut({ callbackUrl: '/' });
                        setIsMenuOpen(false);
                      }} 
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-5 w-5" />
                      <span className="font-medium">Sign out</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col space-y-3">
                <Button asChild variant="outline" size="lg" className="w-full" onClick={() => setIsMenuOpen(false)}>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="lg" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" onClick={() => setIsMenuOpen(false)}>
                  <Link href="/register">Start Adventure</Link>
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 