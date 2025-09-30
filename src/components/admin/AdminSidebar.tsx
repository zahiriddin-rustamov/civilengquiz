'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CreditCard,
  Play,
  MessageSquare,
  Users,
  BarChart3,
  Settings
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  { name: 'Subjects', href: '/admin/subjects', icon: BookOpen },
  { name: 'Topics', href: '/admin/topics', icon: FileText },
  { name: 'Questions', href: '/admin/questions', icon: FileText },
  { name: 'Flashcards', href: '/admin/flashcards', icon: CreditCard },
  { name: 'Media', href: '/admin/media', icon: Play },
  { name: 'Surveys', href: '/admin/surveys', icon: MessageSquare },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    disabled: false,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    disabled: false,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    disabled: true,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavigationItem) => {
    const active = isActive(item.href);

    return (
      <div key={item.href}>
        <div
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            active
              ? 'bg-blue-100 text-blue-700'
              : item.disabled
              ? 'text-gray-400'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          {item.disabled ? (
            <div className="flex items-center flex-1 cursor-not-allowed opacity-50">
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </div>
          ) : (
            <Link href={item.href} className="flex items-center flex-1">
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        {renderNavItem(navigation[0])}

        {/* Content Management Section */}
        <div className="pt-4">
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Content Management
            </h3>
          </div>
          {navigation.slice(1, 7).map(item => renderNavItem(item))}
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Other sections */}
        {navigation.slice(7).map(item => renderNavItem(item))}
      </nav>

      {/* User Info */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-gray-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Administrator</p>
            <p className="text-xs text-gray-500">Admin Access</p>
          </div>
        </div>
      </div>
    </div>
  );
}