"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getDashboards } from '@/features/dashboards/api';
import { Dashboard } from '@/features/dashboards/types';
import { DashboardList } from '@/features/dashboards/components/DashboardList';
import { CreateDashboardModal } from '@/features/dashboards/components/CreateDashboardModal';

export default function DashboardsPage() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDashboards = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDashboards();
      setDashboards(data);
    } catch (err) {
      console.warn('Failed to load dashboards', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboards();
  }, [loadDashboards]);

  const handleCreated = (dashboard: Dashboard) => {
    setIsModalOpen(false);
    router.push(`/dashboards/${dashboard.id}`);
  };

  return (
    <main className="main-layout dashboard-page">
      <header className="dashboard-page-header">
        <h1>All Dashboards</h1>
        <button type="button" className="btn-primary dashboard-new-btn" onClick={() => setIsModalOpen(true)}>
          New Dashboard <ChevronDown size={14} />
        </button>
      </header>

      {isLoading ? (
        <div className="dashboard-loading">Loading dashboards...</div>
      ) : (
        <DashboardList dashboards={dashboards} onRefresh={loadDashboards} />
      )}

      {isModalOpen && (
        <CreateDashboardModal onClose={() => setIsModalOpen(false)} onSuccess={handleCreated} />
      )}
    </main>
  );
}
