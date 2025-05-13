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

export function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 py-3 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <Building className="h-6 w-6" />
            <span>CivilEngQuiz</span>
          </Link>
          
          {isAuthenticated && (
            <div className="hidden items-center space-x-6 md:flex">
              <Link href="/subjects" className="flex items-center gap-1.5 text-foreground/70 transition-colors hover:text-primary">
                <BookOpen className="h-4 w-4" />
                <span>Subjects</span>
              </Link>
              <Link href="/flashcards" className="flex items-center gap-1.5 text-foreground/70 transition-colors hover:text-primary">
                <FileText className="h-4 w-4" />
                <span>Flashcards</span>
              </Link>
              <Link href="/media" className="flex items-center gap-1.5 text-foreground/70 transition-colors hover:text-primary">
                <BarChart3 className="h-4 w-4" />
                <span>Media</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="rounded-md p-2 text-foreground/70 hover:bg-muted md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Desktop auth menu */}
        <div className="hidden md:block">
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

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="border-t md:hidden">
          <div className="container mx-auto space-y-2 px-4 py-4">
            {isAuthenticated ? (
              <>
                <div className="grid gap-2">
                  <Link 
                    href="/subjects"
                    className="flex items-center gap-2 rounded-md p-2 hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span>Subjects</span>
                  </Link>
                  <Link 
                    href="/flashcards"
                    className="flex items-center gap-2 rounded-md p-2 hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Flashcards</span>
                  </Link>
                  <Link 
                    href="/media"
                    className="flex items-center gap-2 rounded-md p-2 hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>Media</span>
                  </Link>
                </div>
                <div className="mt-4 border-t pt-4">
                  <Link 
                    href="/profile"
                    className="flex items-center gap-2 rounded-md p-2 hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-5 w-5 text-primary" />
                    <span>Profile</span>
                  </Link>
                  <Link 
                    href="/progress"
                    className="flex items-center gap-2 rounded-md p-2 hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>My Progress</span>
                  </Link>
                  {session?.user?.role === 'admin' && (
                    <Link 
                      href="/admin"
                      className="flex items-center gap-2 rounded-md p-2 hover:bg-muted"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Building className="h-5 w-5 text-primary" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <button 
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setIsMenuOpen(false);
                    }} 
                    className="mt-2 flex w-full items-center gap-2 rounded-md p-2 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-5 w-5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Button asChild variant="outline" onClick={() => setIsMenuOpen(false)}>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild onClick={() => setIsMenuOpen(false)}>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 