"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, Search } from 'lucide-react';
import { TaskItem, priorityMeta } from '@task/core/features/tasks/types';
import { useTaskSearch } from '@task/core/features/tasks/hooks/useTaskSearch';
import { useSpaceStore } from '@task/core/store/useSpaceStore';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { useI18n } from '@/contexts/I18nContext';

// The top-bar search: type a task name or number ("2", "#2", "task 2") and
// pick a result to open it. Only tasks the user can access come back.
export const TaskSearch = () => {
  const router = useRouter();
  const { t } = useI18n();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const setDetailTaskId = useSpaceStore((s) => s.setDetailTaskId);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const { results, isSearching, noResults, error } = useTaskSearch(query);

  // Close when clicking anywhere else.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Opens the task's project and its detail panel.
  const openTask = (task: TaskItem) => {
    setOpen(false);
    setQuery('');
    setDetailTaskId(task.id);
    router.push(`/projects/${task.projectId}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && results[highlight]) {
      openTask(results[highlight]);
    }
  };

  const showPanel = open && query.trim().length > 0;

  return (
    <div className="search-bar task-search" ref={boxRef}>
      <Search size={18} className="search-icon" />
      <input
        type="text"
        placeholder={t.searchTasksPlaceholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {showPanel && (
        <div className="task-search-panel">
          {error ? (
            <div className="task-search-note error">{error}</div>
          ) : results.length === 0 ? (
            <div className="task-search-note">{noResults ? t.noTasksFound : t.searchingTasks}</div>
          ) : (
            <>
              {results.map((task, i) => {
                const crumb = [task.spaceName, task.projectName].filter(Boolean).join(' / ');
                const mine = task.assignees?.some((a) => a.id === currentUserId);
                return (
                  <button
                    key={task.id}
                    type="button"
                    className={`task-search-item ${i === highlight ? 'highlighted' : ''}`}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => openTask(task)}
                  >
                    <span className="task-search-number">#{task.id}</span>
                    <span className="task-search-text">
                      <span className="task-search-title">{task.title}</span>
                      {crumb && <span className="task-search-crumb">{crumb}</span>}
                    </span>
                    {mine && <span className="task-search-mine">{t.assignedToYou}</span>}
                    <Flag size={13} color={priorityMeta(task.priority).color} />
                  </button>
                );
              })}
              {isSearching && <div className="task-search-note">{t.searchingTasks}</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
};
