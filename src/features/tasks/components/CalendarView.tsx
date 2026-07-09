"use client";

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TaskItem, priorityMeta } from '../types';
import { useFilteredTasks } from '../hooks/useFilteredTasks';

interface CalendarViewProps {
  tasks: TaskItem[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const filteredTasks = useFilteredTasks(tasks);
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Group tasks by their due day.
  const tasksByDay = useMemo(() => {
    const map: Record<string, TaskItem[]> = {};
    for (const task of filteredTasks) {
      if (!task.dueDate) continue;
      const d = new Date(task.dueDate);
      if (isNaN(d.getTime())) continue;
      const key = dayKey(d);
      (map[key] ||= []).push(task);
    }
    return map;
  }, [filteredTasks]);

  const unscheduled = useMemo(() => filteredTasks.filter((t) => !t.dueDate), [filteredTasks]);

  // Build a 6-week grid starting on the Sunday of the first week.
  const cells = useMemo(() => {
    const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const start = new Date(firstOfMonth);
    start.setDate(1 - firstOfMonth.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewDate]);

  const today = new Date();
  const isToday = (d: Date) => dayKey(d) === dayKey(today);
  const inMonth = (d: Date) => d.getMonth() === viewDate.getMonth();

  const changeMonth = (delta: number) =>
    setViewDate((cur) => new Date(cur.getFullYear(), cur.getMonth() + delta, 1));

  return (
    <div className="calendar-view">
      <div className="calendar-toolbar">
        <button className="icon-btn" onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button>
        <span className="calendar-title">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
        <button className="icon-btn" onClick={() => changeMonth(1)}><ChevronRight size={18} /></button>
        <button
          className="btn-secondary calendar-today-btn"
          onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
        >
          Today
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="calendar-weekday">{w}</div>
        ))}
        {cells.map((d, i) => {
          const dayTasks = tasksByDay[dayKey(d)] || [];
          return (
            <div key={i} className={`calendar-cell ${inMonth(d) ? '' : 'muted'} ${isToday(d) ? 'today' : ''}`}>
              <span className="calendar-daynum">{d.getDate()}</span>
              <div className="calendar-cell-tasks">
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="calendar-task-chip"
                    style={{ borderLeftColor: priorityMeta(t.priority).color }}
                    title={t.title}
                  >
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {unscheduled.length > 0 && (
        <div className="calendar-unscheduled">
          <span className="calendar-unscheduled-label">Unscheduled ({unscheduled.length})</span>
          <div className="calendar-unscheduled-list">
            {unscheduled.map((t) => (
              <span key={t.id} className="calendar-task-chip" title={t.title}>{t.title}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
