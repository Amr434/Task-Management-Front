"use client";

import React from 'react';
import { AssigneeCount } from '../types';
import { avatarColor } from '@/features/tasks/types';

interface CompletedThisWeekListProps {
  data: AssigneeCount[];
}

export const CompletedThisWeekList: React.FC<CompletedThisWeekListProps> = ({ data }) => {
  const initials = (label: string) => {
    const parts = label.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return label.slice(0, 2).toUpperCase();
  };

  return (
    <div className="dashboard-widget dashboard-completed-widget">
      <h3 className="dashboard-widget-title">Tasks Completed This Week</h3>
      {data.length === 0 ? (
        <div className="dashboard-empty-chart">No tasks completed this week</div>
      ) : (
        <ul className="dashboard-completed-list">
          {data.map((item) => (
            <li key={item.label} className="dashboard-completed-item">
              <span className="dashboard-completed-count">{item.count}</span>
              <span
                className="dashboard-completed-avatar"
                style={{ backgroundColor: avatarColor({ id: item.userId ?? 0, firstName: '', lastName: '', email: '' }) }}
              >
                {initials(item.label)}
              </span>
              <span className="dashboard-completed-name">{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
