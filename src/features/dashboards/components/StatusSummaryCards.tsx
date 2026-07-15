"use client";

import React from 'react';
import { WorkloadByStatus } from '../types';

interface StatusSummaryCardsProps {
  workload: WorkloadByStatus;
}

export const StatusSummaryCards: React.FC<StatusSummaryCardsProps> = ({ workload }) => {
  const cards = [
    { label: 'Unassigned', value: workload.unassigned },
    { label: 'Assigned', value: workload.assigned },
    { label: 'In Progress', value: workload.inProgress },
    { label: 'Completed', value: workload.completed },
  ];

  return (
    <div className="dashboard-status-cards">
      {cards.map((card) => (
        <div key={card.label} className="dashboard-status-card">
          <span className="dashboard-status-card-label">{card.label}</span>
          <span className="dashboard-status-card-value">{card.value}</span>
          <span className="dashboard-status-card-unit">tasks</span>
        </div>
      ))}
    </div>
  );
};
