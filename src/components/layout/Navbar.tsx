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
import { User, Menu, X, Building, BookOpen, FileText, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 py-3 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between pb-3 px-4 border-b md:border-0">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <Building className="h-6 w-6" />
            <span>CivilEngQuiz</span>
          </Link>
          
          {/* Simplified navbar - removed cluttered links */}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center md:hidden">
          {/* <ThemeToggle /> */}
          <button 
            className="rounded-md p-2 text-foreground/70 hover:bg-muted ml-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Desktop auth menu */}
        <div className="hidden md:flex items-center space-x-2">
          {/* <ThemeToggle /> */}
          
          {isLoading ? (
            <div className="h-10 w-20 animate-pulse rounded-md bg-muted" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="relative flex items-center gap-2 rounded-full px-4">
                  <User className="h-4 w-4" />
                  <span>{session?.user?.name?.split(' ')[0] || 'Account'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/progress" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>My Progress</span>
                  </Link>
                </DropdownMenuItem>
                {session?.user?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="space-x-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu - with animation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="container mx-auto px-4 pt-4 overflow-hidden">
              {isAuthenticated ? (
                <motion.div 
                  className="flex flex-col"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  {/* Main navigation links */}
                  <ul className="flex flex-col w-full space-y-1">
                    <li>
                      <Link 
                        href="/subjects"
                        className="flex w-full items-center gap-3 rounded-md p-2.5 hover:bg-muted"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="text-base font-medium">Subjects</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/flashcards"
                        className="flex w-full items-center gap-3 rounded-md p-2.5 hover:bg-muted"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-base font-medium">Flashcards</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/media"
                        className="flex w-full items-center gap-3 rounded-md p-2.5 hover:bg-muted"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <span className="text-base font-medium">Media</span>
                      </Link>
                    </li>
                  </ul>

                  {/* User account links */}
                  <div className="mt-5 border-t pt-5">
                    <h3 className="mb-2 text-sm font-medium text-foreground/60">Account</h3>
                    <ul className="flex flex-col w-full space-y-1">
                      <li>
                        <Link 
                          href="/profile"
                          className="flex w-full items-center gap-3 rounded-md p-2.5 hover:bg-muted"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <User className="h-5 w-5 text-primary" />
                          <span className="text-base font-medium">Profile</span>
                        </Link>
                      </li>
                      <li>
                        <Link 
                          href="/progress"
                          className="flex w-full items-center gap-3 rounded-md p-2.5 hover:bg-muted"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <BarChart3 className="h-5 w-5 text-primary" />
                          <span className="text-base font-medium">My Progress</span>
                        </Link>
                      </li>
                      {session?.user?.role === 'admin' && (
                        <li>
                          <Link 
                            href="/admin"
                            className="flex w-full items-center gap-3 rounded-md p-2.5 hover:bg-muted"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Building className="h-5 w-5 text-primary" />
                            <span className="text-base font-medium">Admin Dashboard</span>
                          </Link>
                        </li>
                      )}
                      <li>
                        <button 
                          onClick={() => {
                            signOut({ callbackUrl: '/' });
                            setIsMenuOpen(false);
                          }} 
                          className="flex w-full items-center gap-3 rounded-md p-2.5 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-5 w-5" />
                          <span className="text-base font-medium">Sign out</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col space-y-2 py-4">
                  <Button asChild variant="outline" size="lg" onClick={() => setIsMenuOpen(false)}>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="lg" onClick={() => setIsMenuOpen(false)}>
                    <Link href="/register">Register</Link>
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