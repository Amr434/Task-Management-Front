"use client";

import React from 'react';
import { WorkloadByStatus } from '../types';

interface WorkloadChartProps {
  workload: WorkloadByStatus;
}

const SEGMENTS = [
  { key: 'unassigned' as const, label: 'Unassigned', color: '#87909e' },
  { key: 'assigned' as const, label: 'Assigned', color: '#2684ff' },
  { key: 'inProgress' as const, label: 'In Progress', color: '#ffb800' },
  { key: 'completed' as const, label: 'Completed', color: '#00c875' },
];

export const WorkloadChart: React.FC<WorkloadChartProps> = ({ workload }) => {
  const total = SEGMENTS.reduce((sum, s) => sum + workload[s.key], 0);
  const maxScale = Math.max(total, 10);

  return (
    <div className="dashboard-widget dashboard-workload-widget">
      <h3 className="dashboard-widget-title">Workload by Status</h3>
      <div className="dashboard-workload-bar-wrap">
        <div className="dashboard-workload-bar">
          {SEGMENTS.map((seg) => {
            const count = workload[seg.key];
            if (count === 0) return null;
            const widthPct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div
                key={seg.key}
                className="dashboard-workload-segment"
                style={{ width: `${widthPct}%`, backgroundColor: seg.color }}
                title={`${seg.label}: ${count}`}
              />
            );
          })}
        </div>
        <div className="dashboard-workload-axis">
          {Array.from({ length: 11 }, (_, i) => {
            const val = Math.round((maxScale / 10) * i);
            return (
              <span key={i} className="dashboard-workload-tick">
                {val}
              </span>
            );
          })}
        </div>
        <span className="dashboard-workload-axis-label">Tasks</span>
      </div>
      <div className="dashboard-workload-legend">
        {SEGMENTS.map((seg) => (
          <span key={seg.key} className="dashboard-legend-item">
            <span className="dashboard-legend-dot" style={{ backgroundColor: seg.color }} />
            {seg.label}: {workload[seg.key]}
          </span>
        ))}
      </div>
    </div>
  );
};
