"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
  UserCircle2, Calendar as CalendarIcon, Flag, Tag as TagIcon, CornerDownLeft,
} from 'lucide-react';
import { Priority, PRIORITY_META, Tag, User } from '../types';
import { PriorityMenu, AssigneeMenu, DateMenu, TagMenu, TagPills, AvatarStack, shortDate } from './TaskFieldMenus';

export interface ComposerResult {
  title: string;
  priority: Priority;
  dueDate?: string;
  tagIds: number[];
  assigneeIds: number[];
}

interface InlineTaskComposerProps {
  projectId: number;
  projectName: string;
  onCreate: (data: ComposerResult) => Promise<void> | void;
  onCancel: () => void;
}

type Field = 'assignee' | 'dates' | 'priority' | 'tag' | null;

export const InlineTaskComposer: React.FC<InlineTaskComposerProps> = ({ projectId, projectName, onCreate, onCancel }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [openField, setOpenField] = useState<Field>(null);
  const [saving, setSaving] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  // Clicking outside the composer, or pressing Escape, closes it. If a dropdown
  // is open, the first outside click just closes the dropdown.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        if (openField) setOpenField(null);
        else onCancel();
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [openField, onCancel]);

  const toggle = (field: Field) => setOpenField((cur) => (cur === field ? null : field));

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        priority: priority ?? Priority.Low,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        tagIds: tags.map((t) => t.id),
        assigneeIds: assignees.map((u) => u.id),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="task-composer" ref={rootRef} onClick={(e) => e.stopPropagation()}>
      {/* Title + Save */}
      <div className="composer-title-row">
        <input
          className="composer-title-input"
          placeholder="Task Name..."
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
        <button className="composer-save" onClick={handleSave} disabled={!title.trim() || saving}>
          {saving ? 'Saving' : 'Save'} <CornerDownLeft size={13} />
        </button>
      </div>

      <div className="composer-project">{projectName}</div>

      {/* Field rows */}
      <div className="composer-fields">
        {/* Assignee */}
        <div className="composer-field-wrap">
          <button className={`composer-field ${assignees.length > 0 ? 'filled' : ''}`} onClick={() => toggle('assignee')}>
            {assignees.length > 0 ? <AvatarStack users={assignees} /> : <UserCircle2 size={18} />}
            <span>{assignees.length > 0 ? `${assignees.length} assigned` : 'Add assignee'}</span>
          </button>
          {openField === 'assignee' && (
            <AssigneeMenu
              projectId={projectId}
              selected={assignees}
              onToggle={(u) => setAssignees((cur) => cur.some((a) => a.id === u.id) ? cur.filter((a) => a.id !== u.id) : [...cur, u])}
            />
          )}
        </div>

        {/* Dates */}
        <div className="composer-field-wrap">
          <button className={`composer-field ${dueDate ? 'filled' : ''}`} onClick={() => toggle('dates')}>
            <CalendarIcon size={17} />
            <span>{dueDate ? shortDate(dueDate) : 'Add dates'}</span>
          </button>
          {openField === 'dates' && (
            <DateMenu
              value={dueDate}
              onSelect={(d) => { setDueDate(d); setOpenField(null); }}
              onClear={() => { setDueDate(null); setOpenField(null); }}
            />
          )}
        </div>

        {/* Priority */}
        <div className="composer-field-wrap">
          <button className={`composer-field ${priority !== null ? 'filled' : ''}`} onClick={() => toggle('priority')}>
            <Flag size={16} style={{ color: priority !== null ? PRIORITY_META[priority].color : undefined }} />
            <span>{priority !== null ? PRIORITY_META[priority].label : 'Add priority'}</span>
          </button>
          {openField === 'priority' && (
            <PriorityMenu
              value={priority}
              onSelect={(p) => { setPriority(p); setOpenField(null); }}
              onClear={() => { setPriority(null); setOpenField(null); }}
            />
          )}
        </div>

        {/* Tag */}
        <div className="composer-field-wrap">
          <button className={`composer-field ${tags.length ? 'filled' : ''}`} onClick={() => toggle('tag')}>
            <TagIcon size={16} />
            {tags.length ? <TagPills tags={tags} max={4} /> : <span>Add tag</span>}
          </button>
          {openField === 'tag' && (
            <TagMenu selected={tags} onChange={setTags} />
          )}
        </div>
      </div>
    </div>
  );
};
