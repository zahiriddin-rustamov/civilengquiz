'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  Menu, 
  X, 
  Building, 
  BookOpen, 
  FileText, 
  BarChart3,
  Trophy,
  Flame,
  Star,
  Zap,
  Target,
  Crown,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
export function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const firstName = session?.user?.name?.split(' ')[0] || 'Student';

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-indigo-50/90 via-white/90 to-cyan-50/90 backdrop-blur-md border-b border-indigo-100/50 shadow-sm">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="relative">
              <Building className="h-7 w-7 text-indigo-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              CivilEngQuiz
            </span>
          </Link>
          
          {/* Gaming Navigation Links - Desktop */}
          {isAuthenticated && (
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
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center lg:hidden">
          <button 
            className="rounded-lg p-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Desktop auth menu */}
        <div className="hidden lg:flex items-center space-x-3">
          {isLoading ? (
            <div className="h-10 w-32 animate-pulse rounded-full bg-gray-200" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative flex items-center gap-3 rounded-full px-5 py-2 h-auto bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200/50 shadow-sm transition-all hover:shadow-md"
                >
                  {/* Gaming Avatar */}
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm">
                      {firstName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-800">{firstName}</div>
                    <div className="text-xs text-gray-600">Student</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-64 p-2 bg-white border border-indigo-100 shadow-xl">
                <DropdownMenuLabel className="text-gray-600 font-medium px-2">Navigation</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-indigo-50">
                    <Crown className="h-4 w-4 text-indigo-600" />
                    <span>Gaming Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/subjects" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-indigo-50">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span>Study Worlds</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/achievements" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-indigo-50">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span>Achievements</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuLabel className="text-gray-600 font-medium px-2">Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50">
                    <User className="h-4 w-4 text-gray-600" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/progress" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50">
                    <BarChart3 className="h-4 w-4 text-gray-600" />
                    <span>Progress Analytics</span>
                  </Link>
                </DropdownMenuItem>
                {session?.user?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50">
                      <Settings className="h-4 w-4 text-gray-600" />
                      <span>Admin Portal</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuItem 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm">
                <Link href="/register">Start Adventure</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu - with gaming enhancements */}
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
              {isAuthenticated ? (
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
                      className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-indigo-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Crown className="h-5 w-5 text-indigo-600" />
                      <span className="font-medium">Gaming Dashboard</span>
                    </Link>
                    <Link 
                      href="/subjects"
                      className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-indigo-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Study Worlds</span>
                    </Link>
                    <Link 
                      href="/challenges"
                      className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-indigo-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Target className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Daily Challenges</span>
                    </Link>
                    <Link 
                      href="/achievements"
                      className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-indigo-50 transition-colors"
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
                        <span className="font-medium">Profile Settings</span>
                      </Link>
                      <Link 
                        href="/progress"
                        className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <BarChart3 className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">Progress Analytics</span>
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
    </nav>
  );
} 