"use client";

import React, { useEffect, useRef, useState } from 'react';
import { User as UserIcon, Check, Ban } from 'lucide-react';
import { useSpaceStore } from '@/store/useSpaceStore';
import { getUsers } from '@/features/tasks/api';
import { User, userDisplayName } from '@/features/tasks/types';
import { Avatar } from '@/features/tasks/components/TaskFieldMenus';

// Toolbar control that filters the list to tasks assigned to a chosen user.
export const AssigneeFilterControl: React.FC = () => {
  const filterAssigneeId = useSpaceStore((s) => s.filterAssigneeId);
  const setFilterAssigneeId = useSpaceStore((s) => s.setFilterAssigneeId);

  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loaded, setLoaded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || loaded) return;
    getUsers()
      .then(setUsers)
      .catch((e) => console.warn('Failed to load users', e instanceof Error ? e.message : String(e)))
      .finally(() => setLoaded(true));
  }, [open, loaded]);

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
        <UserIcon size={14} /> {selected ? userDisplayName(selected) : 'Assignee'}
      </button>

      {open && (
        <div className="group-popover align-right">
          <div className="group-popover-title">Filter by assignee</div>

          {!loaded && <div className="dd-empty">Loading…</div>}

          {loaded && users.map((u) => (
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
                <span>Clear filter</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
