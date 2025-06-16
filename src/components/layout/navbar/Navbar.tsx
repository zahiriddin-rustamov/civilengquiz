'use client';

import { useSession } from 'next-auth/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NavbarBrand } from './NavbarBrand';
import { NavbarNavigation } from './NavbarNavigation';
import { NavbarUserMenu } from './NavbarUserMenu';
import { NavbarAuth } from './NavbarAuth';
import { NavbarMobileMenu } from './NavbarMobileMenu';

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
          <NavbarBrand />
          <NavbarNavigation isAuthenticated={isAuthenticated} />
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
          ) : isAuthenticated && session ? (
            <NavbarUserMenu session={session} firstName={firstName} />
          ) : (
            <NavbarAuth />
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <NavbarMobileMenu 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isAuthenticated={isAuthenticated}
        session={session}
        firstName={firstName}
      />
    </nav>
  );
} 