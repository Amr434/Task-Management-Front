"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';

// Client-side route guard: the whole app is client-rendered against the
// .NET API, so gating happens here rather than in server middleware
// (tokens live in localStorage, invisible to the server).
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);

  const authenticated = Boolean(accessToken) && !mustChangePassword;

  useEffect(() => {
    if (hydrated && !authenticated) {
      router.replace('/login');
    }
  }, [hydrated, authenticated, router]);

  if (!hydrated || !authenticated) {
    return <div className="auth-loading">Loading…</div>;
  }

  return <>{children}</>;
};
