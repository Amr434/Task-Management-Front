"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppLayout } from './AppLayout';
import { AuthGuard } from '@/features/auth/components/AuthGuard';

// /login renders bare (no sidebar/topbar, no guard); everything else is
// wrapped in the auth guard and the app chrome.
export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
};
