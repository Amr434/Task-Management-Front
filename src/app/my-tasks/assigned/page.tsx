"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getAssignedTasks } from '@/features/tasks/api';
import { isNetworkError } from '@/services/apiClient';
import { TaskItem } from '@/features/tasks/types';
import { TaskRow } from '@/features/tasks/components/TaskRow';
import { useColumnGridTemplate } from '@/features/tasks/hooks/useColumnGridTemplate';
import { useSpaceStore } from '@/store/useSpaceStore';
import { useI18n } from '@/contexts/I18nContext';

export default function AssignedToMePage() {
  const { t } = useI18n();
  const tasks = useSpaceStore((s) => s.assignedTasks);
  const setAssignedTasks = useSpaceStore((s) => s.setAssignedTasks);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<'network' | 'other' | null>(null);

  const visibleColumns = useSpaceStore((s) => s.visibleColumns);
  const gridTemplateColumns = useColumnGridTemplate();

  const loadTasks = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    getAssignedTasks()
      .then(data => setAssignedTasks(data))
      .catch(err => {
        console.warn('Failed to fetch assigned tasks:', err instanceof Error ? err.message : String(err));
        setLoadError(isNetworkError(err) ? 'network' : 'other');
      })
      .finally(() => setLoading(false));
  }, [setAssignedTasks]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const { rootTasks, childrenByParent } = useMemo(() => {
    const byParent: Record<number, TaskItem[]> = {};
    const root: TaskItem[] = [];
    
    tasks.forEach(task => {
      if (task.parentTaskId) {
        if (!byParent[task.parentTaskId]) byParent[task.parentTaskId] = [];
        byParent[task.parentTaskId].push(task);
      }
    });
    
    tasks.forEach(task => {
      // If a task has no parent, or its parent is not in this list (e.g. parent wasn't assigned to me), treat it as a root task
      if (!task.parentTaskId || !tasks.find(t => t.id === task.parentTaskId)) {
        root.push(task);
      }
    });
    
    return { rootTasks: root, childrenByParent: byParent };
  }, [tasks]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>{t.assignedToMe}</h1>
      </div>
      
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>{t.loadingTasks}</div>
        ) : loadError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-secondary)' }}>
            <p style={{ margin: 0 }}>{loadError === 'network' ? t.serverUnreachable : t.tasksLoadFailed}</p>
            <button
              onClick={loadTasks}
              style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              {t.retry}
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <p>{t.assignedEmpty}</p>
          </div>
        ) : (
          <div className="list-tasks-container">
            <div className="table-header" style={{ gridTemplateColumns }}>
              <div className="th-cell th-name">{t.colName}</div>
              {visibleColumns.assignee && <div className="th-cell th-assignee">{t.colAssignee}</div>}
              {visibleColumns.dueDate && <div className="th-cell th-due">{t.colDueDate}</div>}
              {visibleColumns.priority && <div className="th-cell th-priority">{t.colPriority}</div>}
            </div>

            {rootTasks.map((task) => (
              <TaskRow 
                key={task.id} 
                task={task} 
                childrenByParent={childrenByParent} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
