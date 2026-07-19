"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Flag } from 'lucide-react';
import { getAssignedTasks, patchTask } from '@/features/tasks/api';
import { isNetworkError } from '@/services/apiClient';
import { TaskItem, TaskStatus, priorityMeta } from '@/features/tasks/types';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useI18n } from '@/contexts/I18nContext';

type Bucket = 'overdue' | 'today' | 'next' | 'unscheduled';


export default function TodayAndOverduePage() {
  const router = useRouter();
  const { t } = useI18n();
  const currentUser = useAuthStore((s) => s.user);

  const BUCKET_LABELS: Record<Bucket, string> = {
    overdue: t.overdue, today: t.today, next: t.next, unscheduled: t.unscheduled,
  };
  const EMPTY_HINTS: Record<Bucket, string> = {
    overdue: t.noOverdueTasks, today: t.noDueToday, next: t.noUpcoming, unscheduled: t.noUnscheduledTasks,
  };

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<'network' | 'other' | null>(null);
  const [tab, setTab] = useState<'todo' | 'done'>('todo');
  const [collapsed, setCollapsed] = useState<Record<Bucket, boolean>>({
    overdue: false, today: false, next: false, unscheduled: false,
  });

  const loadTasks = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    getAssignedTasks()
      .then(setTasks)
      .catch((err) => {
        console.warn('Failed to fetch assigned tasks:', err instanceof Error ? err.message : String(err));
        setLoadError(isNetworkError(err) ? 'network' : 'other');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const buckets = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const result: Record<Bucket, TaskItem[]> = { overdue: [], today: [], next: [], unscheduled: [] };

    for (const t of tasks) {
      // The assigned endpoint also returns subtasks of my tasks for the tree
      // view; here only tasks actually assigned to me count.
      if (currentUser && !t.assignees?.some((a) => a.id === currentUser.id)) continue;

      const done = t.status === TaskStatus.Complete;
      if (tab === 'todo' ? done : !done) continue;

      if (!t.dueDate) { result.unscheduled.push(t); continue; }
      const due = new Date(t.dueDate);
      if (due < startOfToday) result.overdue.push(t);
      else if (due < endOfToday) result.today.push(t);
      else result.next.push(t);
    }

    const byDue = (a: TaskItem, b: TaskItem) =>
      new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime();
    result.overdue.sort(byDue);
    result.today.sort(byDue);
    result.next.sort(byDue);

    return result;
  }, [tasks, tab, currentUser]);

  const markComplete = (task: TaskItem) => {
    if (task.status === TaskStatus.Complete) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: TaskStatus.Complete } : t)));
    patchTask(task, { status: TaskStatus.Complete }).catch((e) => {
      console.warn('Failed to complete task', e instanceof Error ? e.message : String(e));
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    });
  };

  const renderBucket = (bucket: Bucket) => {
    const items = buckets[bucket];
    const isCollapsed = collapsed[bucket];

    return (
      <div key={bucket} style={{ marginBottom: '16px' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}
          onClick={() => setCollapsed((prev) => ({ ...prev, [bucket]: !prev[bucket] }))}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <span style={{ fontWeight: 'bold' }}>{BUCKET_LABELS[bucket]}</span>
          <span style={{ color: bucket === 'overdue' && items.length > 0 ? '#e2445c' : 'var(--text-secondary)', fontSize: '12px' }}>
            {items.length}
          </span>
        </div>

        {!isCollapsed && (
          items.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '22px' }}>
              {EMPTY_HINTS[bucket]}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {items.map((task) => {
                const overdue = bucket === 'overdue';
                const crumb = [task.spaceName, task.projectName].filter(Boolean).join(' / ');
                return (
                  <div
                    key={task.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                    className="today-task-row"
                    onClick={() => router.push(`/projects/${task.projectId}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <button
                        title="Mark complete"
                        onClick={(e) => { e.stopPropagation(); markComplete(task); }}
                        style={{ width: '14px', height: '14px', border: '1px solid var(--text-secondary)', borderRadius: '50%', background: task.status === TaskStatus.Complete ? '#00c875' : 'transparent', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                      />
                      <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </span>
                      {crumb && (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          • {crumb}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      {task.dueDate && (
                        <span style={{ color: overdue ? '#e2445c' : 'var(--text-secondary)', fontSize: '12px' }}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <Flag size={14} color={priorityMeta(task.priority).color} />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {t.myTasks} / <span style={{ color: 'var(--text-primary)' }}>{t.todayOverdue}</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <div style={{ backgroundColor: '#212224', borderRadius: '8px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px 0' }}>{t.myWork}</h2>

          <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
            {(['todo', 'done'] as const).map((tabKey) => (
              <span
                key={tabKey}
                onClick={() => setTab(tabKey)}
                style={tab === tabKey
                  ? { fontWeight: 'bold', color: 'var(--text-primary)', borderBottom: '2px solid var(--text-primary)', paddingBottom: '8px', marginBottom: '-1px', cursor: 'pointer' }
                  : { color: 'var(--text-secondary)', paddingBottom: '8px', cursor: 'pointer' }}
              >
                {tabKey === 'todo' ? t.toDo : t.done}
              </span>
            ))}
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t.loadingTasks}</div>
          ) : loadError ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <p style={{ margin: 0 }}>{loadError === 'network' ? t.serverUnreachable : t.tasksLoadFailed}</p>
              <button
                onClick={loadTasks}
                style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                {t.retry}
              </button>
            </div>
          ) : (
            (['overdue', 'today', 'next', 'unscheduled'] as Bucket[]).map(renderBucket)
          )}
        </div>
      </div>
    </div>
  );
}
