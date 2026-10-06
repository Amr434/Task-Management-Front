"use client";

import React from 'react';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { canViewDashboards } from '@task/core/features/auth/types';
import { useI18n } from '@/contexts/I18nContext';

// Dashboards (the list and each dashboard) are for Admins and the Super Admin.
// A Member who opens the address directly sees this message instead; the
// backend refuses the data as well.
export default function DashboardsLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const role = useAuthStore((s) => s.user?.role);

  if (!canViewDashboards(role)) {
    return (
      <main className="main-layout dashboard-page">
        <div className="dashboard-loading">{t.notAllowedToViewDashboards}</div>
      </main>
    );
  }

  return <>{children}</>;
}
