'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider } from '@/context/ThemeProvider';
import { DashboardProvider } from '@/context/DashboardProvider';

interface ConditionalLayoutProps {
  children: ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    // For admin routes, only provide context providers without AppLayout
    return (
      <ThemeProvider>
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </ThemeProvider>
    );
  }

  // For non-admin routes, use the full AppLayout
  return <AppLayout>{children}</AppLayout>;
}