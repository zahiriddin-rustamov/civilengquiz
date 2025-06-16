'use client';

import Link from 'next/link';
import { Building } from 'lucide-react';

export function NavbarBrand() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
      <div className="relative">
        <Building className="h-7 w-7 text-indigo-600" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
      </div>
      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        CivilEngQuiz
      </span>
    </Link>
  );
} 