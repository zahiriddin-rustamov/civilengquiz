'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
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
  X, 
  BookOpen, 
  BarChart3,
  Trophy,
  Crown,
  Settings
} from 'lucide-react';
import type { Session } from 'next-auth';

interface NavbarUserMenuProps {
  session: Session;
  firstName: string;
}

export function NavbarUserMenu({ session, firstName }: NavbarUserMenuProps) {
  return (
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
            <div className="text-xs text-gray-600 capitalize">{session?.user?.role || 'Student'}</div>
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
            <span>Profile</span>
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
  );
} 