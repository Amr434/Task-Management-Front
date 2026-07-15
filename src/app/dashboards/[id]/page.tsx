"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDashboardSummary } from '@/features/dashboards/api';
import { DashboardSummary } from '@/features/dashboards/types';
import { DashboardView } from '@/features/dashboards/components/DashboardView';

export default function DashboardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError('Invalid dashboard ID');
      return;
    }

    getDashboardSummary(id)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'));
  }, [id]);

  if (error) {
    return (
      <main className="main-layout dashboard-page">
        <div className="dashboard-error">
          <p>{error}</p>
          <button type="button" className="btn-secondary" onClick={() => router.push('/dashboards')}>
            Back to dashboards
          </button>
        </div>
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="main-layout dashboard-page">
        <div className="dashboard-loading">Loading dashboard...</div>
      </main>
    );
  }

  return (
    <main className="main-layout dashboard-page">
      <DashboardView initialSummary={summary} />
    </main>
  );
}
