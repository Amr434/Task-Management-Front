"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AssigneeCount } from '../types';

const COLORS = ['#87909e', '#5c6370', '#aa8d80', '#2684ff', '#12a594', '#7b68ee', '#ffb800', '#e2445c'];

interface AssigneePieChartProps {
  title: string;
  data: AssigneeCount[];
}

export const AssigneePieChart: React.FC<AssigneePieChartProps> = ({ title, data }) => {
  const chartData = data.map((d) => ({ name: d.label, value: d.count }));
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="dashboard-widget dashboard-pie-widget">
      <h3 className="dashboard-widget-title">{title}</h3>
      {total === 0 ? (
        <div className="dashboard-empty-chart">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(1)}%`}
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value ?? 0} tasks`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
