"use client";

import '@/services/apiConfig';
import React from 'react';
import { usePathname } from 'next/navigation';
import { AppLayout } from './AppLayout';
import { AuthGuard } from '@/features/auth/components/AuthGuard';

// Pages for signed-out visitors render bare (no sidebar/topbar, no guard);
// everything else is wrapped in the auth guard and the app chrome.
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
};
