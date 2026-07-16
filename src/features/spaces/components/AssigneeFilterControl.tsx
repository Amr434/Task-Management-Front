"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User as UserIcon, Check, Ban } from 'lucide-react';
import { useSpaceStore } from '@/store/useSpaceStore';
import { User, userDisplayName } from '@/features/tasks/types';
import { Avatar } from '@/features/tasks/components/TaskFieldMenus';
import { useI18n } from '@/contexts/I18nContext';

// Toolbar control that filters the list to tasks assigned to a chosen user.
export const AssigneeFilterControl: React.FC = () => {
  const { t } = useI18n();
  const filterAssigneeId = useSpaceStore((s) => s.filterAssigneeId);
  const setFilterAssigneeId = useSpaceStore((s) => s.setFilterAssigneeId);
  const tasksByProjectId = useSpaceStore((s) => s.tasksByProjectId);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Offer only people actually assigned to tasks in view — not the whole user
  // directory, which members of this project may not be allowed to see.
  const users = useMemo(() => {
    const byId = new Map<number, User>();
    for (const tasks of Object.values(tasksByProjectId)) {
      for (const task of tasks) {
        for (const assignee of task.assignees ?? []) {
          if (!byId.has(assignee.id)) byId.set(assignee.id, assignee);
        }
      }
    }
    return [...byId.values()];
  }, [tasksByProjectId]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = users.find((u) => u.id === filterAssigneeId) ?? null;

  const pick = (userId: number | null) => {
    setFilterAssigneeId(userId);
    setOpen(false);
  };

  return (
    <div className="group-control" ref={rootRef}>
      <button
        className={`icon-text-btn ${filterAssigneeId !== null ? 'active' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <UserIcon size={14} /> {selected ? userDisplayName(selected) : t.colAssignee}
      </button>

      {open && (
        <div className="group-popover align-right">
          <div className="group-popover-title">{t.filterByAssignee}</div>

          {users.length === 0 && <div className="dd-empty">{t.noAssignedTasks}</div>}

          {users.map((u) => (
            <button
              key={u.id}
              className={`group-option ${filterAssigneeId === u.id ? 'selected' : ''}`}
              onClick={() => pick(filterAssigneeId === u.id ? null : u.id)}
            >
              <Avatar user={u} size="sm" title={false} />
              <span>{userDisplayName(u)}</span>
              {filterAssigneeId === u.id && <Check size={16} className="group-check" />}
            </button>
          ))}

          {filterAssigneeId !== null && (
            <>
              <div className="group-popover-divider" />
              <button className="group-option danger" onClick={() => pick(null)}>
                <Ban size={16} />
                <span>{t.clearFilter}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
