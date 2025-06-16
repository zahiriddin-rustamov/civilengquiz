'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function NavbarAuth() {
  return (
    <div className="flex items-center space-x-2">
      <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">
        <Link href="/login">Login</Link>
      </Button>
      <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm">
        <Link href="/register">Start Adventure</Link>
      </Button>
    </div>
  );
} 