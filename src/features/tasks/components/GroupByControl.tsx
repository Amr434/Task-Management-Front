"use client";

import React, { useEffect, useRef, useState } from 'react';
import { CircleDot, User, Flag, Tag as TagIcon, Calendar, Check, ArrowUp, ArrowDown, Trash2, ListFilter } from 'lucide-react';
import { useSpaceStore, GroupBy } from '@/store/useSpaceStore';
import { useI18n } from '@/contexts/I18nContext';

const FIELDS: { key: GroupBy; label: string; icon: React.ElementType }[] = [
  { key: 'status', label: 'Status', icon: CircleDot },
  { key: 'assignee', label: 'Assignee', icon: User },
  { key: 'priority', label: 'Priority', icon: Flag },
  { key: 'tags', label: 'Tags', icon: TagIcon },
  { key: 'dueDate', label: 'Due date', icon: Calendar },
];

export const GroupByControl: React.FC = () => {
  const { groupBy, groupDir, setGroupBy, setGroupDir } = useSpaceStore();
  const { t } = useI18n();
  const fieldLabels: Record<string, string> = {
    status: t.statusLabel, assignee: t.colAssignee, priority: t.colPriority, tags: t.colTags, dueDate: t.colDueDate,
  };
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

  const triggerLabel = groupBy === 'none' ? t.noneLabel : fieldLabels[groupBy] ?? t.statusLabel;

  return (
    <div className="group-control" ref={rootRef}>
      <button className="btn-secondary group-btn" onClick={() => setOpen((v) => !v)}>
        <ListFilter size={14} /> {t.group}: {triggerLabel}
      </button>

      {open && (
        <div className="group-popover">
          <div className="group-popover-title">{t.groupByTitle}</div>

          {FIELDS.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                className={`group-option ${groupBy === f.key ? 'selected' : ''}`}
                onClick={() => setGroupBy(f.key)}
              >
                <Icon size={16} />
                <span>{fieldLabels[f.key]}</span>
                {groupBy === f.key && <Check size={16} className="group-check" />}
              </button>
            );
          })}

          <div className="group-popover-divider" />

          <div className="group-dir-row">
            <button
              className={`group-dir-btn ${groupDir === 'asc' ? 'active' : ''}`}
              onClick={() => setGroupDir('asc')}
            >
              <ArrowUp size={14} /> {t.ascending}
            </button>
            <button
              className={`group-dir-btn ${groupDir === 'desc' ? 'active' : ''}`}
              onClick={() => setGroupDir('desc')}
            >
              <ArrowDown size={14} /> {t.descending}
            </button>
          </div>

          {groupBy !== 'none' && (
            <>
              <div className="group-popover-divider" />
              <button className="group-option danger" onClick={() => { setGroupBy('none'); setOpen(false); }}>
                <Trash2 size={16} />
                <span>{t.removeGrouping}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
