"use client";

import React, { useRef, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { DashboardSummary } from '../types';
import { getDashboardSummary } from '../api';
import { exportDashboardPdf } from '../utils/exportPdf';
import { SpaceIcon } from '@/features/spaces/components/SpaceIcon';
import { StatusSummaryCards } from './StatusSummaryCards';
import { WorkloadChart } from './WorkloadChart';
import { AssigneePieChart } from './AssigneePieChart';
import { CompletedThisWeekList } from './CompletedThisWeekList';

interface DashboardViewProps {
  initialSummary: DashboardSummary;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ initialSummary }) => {
  const [summary, setSummary] = useState(initialSummary);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getDashboardSummary(summary.dashboard.id);
      setSummary(data);
    } catch (err) {
      console.warn('Failed to refresh dashboard', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      await exportDashboardPdf(exportRef.current, summary);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const { dashboard, workloadByStatus, isSpaceShared } = summary;

  return (
    <div className="dashboard-detail">
      <header className="dashboard-detail-header">
        <div>
          <h1>{dashboard.name}</h1>
          <div className="dashboard-detail-meta">
            <SpaceIcon icon={summary.spaceIcon} color={summary.spaceColor} size={24} />
            <span>{summary.spaceName}</span>
            <span className="dashboard-meta-sep">·</span>
            <span>Space ID: {dashboard.spaceId}</span>
            <span className="dashboard-meta-sep">·</span>
            <span>Owner ID: {dashboard.ownerId}</span>
          </div>
          <div className="dashboard-detail-dates">
            <span>Created: {new Date(dashboard.createdAt).toLocaleString()}</span>
            <span>Updated: {new Date(dashboard.updatedAt).toLocaleString()}</span>
          </div>
        </div>
        <div className="dashboard-detail-actions">
          <button type="button" className="btn-secondary" onClick={refresh} disabled={isRefreshing}>
            <RefreshCw size={14} /> {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button type="button" className="btn-primary" onClick={handleExport} disabled={isExporting}>
            <Download size={14} /> {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </header>

      <div ref={exportRef} className="dashboard-export-area">
        {!isSpaceShared && (
          <div className="dashboard-notice">
            Workload by status is available for shared spaces only. Invite members to this space to see status breakdown.
          </div>
        )}

        {isSpaceShared && workloadByStatus && (
          <>
            <StatusSummaryCards workload={workloadByStatus} />
            <WorkloadChart workload={workloadByStatus} />
          </>
        )}

        <div className="dashboard-charts-row">
          <AssigneePieChart title="Total Tasks by Assignee" data={summary.tasksByAssignee} />
          <AssigneePieChart title="Open Tasks by Assignee" data={summary.openTasksByAssignee} />
          <CompletedThisWeekList data={summary.completedThisWeekByAssignee} />
        </div>
      </div>
    </div>
  );
};
