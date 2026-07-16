"use client";

import React, { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, User, Calendar, Flag, Tag as TagIcon } from 'lucide-react';
import { useSpaceStore, TaskColumn } from '@/store/useSpaceStore';
import { useI18n } from '@/contexts/I18nContext';

const COLUMNS: { key: TaskColumn; label: string; icon: React.ElementType }[] = [
  { key: 'assignee', label: 'Assignee', icon: User },
  { key: 'dueDate', label: 'Due date', icon: Calendar },
  { key: 'priority', label: 'Priority', icon: Flag },
  { key: 'tags', label: 'Tags', icon: TagIcon },
];

// Toolbar control to show/hide list columns.
export const CustomizeColumnsControl: React.FC = () => {
  const { t } = useI18n();
  const colLabels: Record<string, string> = {
    assignee: t.colAssignee, dueDate: t.colDueDate, priority: t.colPriority, tags: t.colTags,
  };
  const visibleColumns = useSpaceStore((s) => s.visibleColumns);
  const toggleColumn = useSpaceStore((s) => s.toggleColumn);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const hiddenCount = COLUMNS.filter((c) => !visibleColumns[c.key]).length;

  return (
    <div className="group-control" ref={rootRef}>
      <button
        className={`icon-text-btn ${hiddenCount > 0 ? 'active' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal size={14} /> {t.customize}
      </button>

      {open && (
        <div className="group-popover align-right">
          <div className="group-popover-title">{t.showColumns}</div>

          {COLUMNS.map((c) => {
            const Icon = c.icon;
            const on = visibleColumns[c.key];
            return (
              <button
                key={c.key}
                className="group-option col-toggle-row"
                onClick={() => toggleColumn(c.key)}
              >
                <Icon size={16} />
                <span>{colLabels[c.key]}</span>
                <span className={`toggle-switch ${on ? 'on' : ''}`}>
                  <span className="toggle-knob" />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
