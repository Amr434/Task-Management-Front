import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar, Flag, Pencil, Plus, Tag as TagIcon, MoreHorizontal, Trash2,
  ChevronRight, ChevronDown, GitBranch, CornerDownLeft, Check
} from 'lucide-react';
import { TaskItem, toPriority, Priority, Tag } from '../types';
import { useTaskSelection } from '@/contexts/TaskSelectionContext';
import { patchTask, createTask, deleteTask, addTagToTask, removeTagFromTask } from '../api';
import { DateMenu, PriorityMenu, TagMenu, TagPills } from './TaskFieldMenus';

const INDENT_BASE = 48;
const INDENT_STEP = 24;

interface TaskRowProps {
  task: TaskItem;
  /** Map of parentTaskId -> its direct subtasks, for recursive rendering. */
  childrenByParent: Record<number, TaskItem[]>;
  depth?: number;
  onToggleStatus?: (taskId: number) => void;
  /** Called after any change that needs the list to refresh. */
  onChanged?: () => void;
}

type RowField = 'dates' | 'priority' | 'tag' | 'menu' | null;

// Dashed-circle status glyph reused by rows and the subtask composer.
const StatusGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
);

export const TaskRow: React.FC<TaskRowProps> = ({ task, childrenByParent, depth = 0, onToggleStatus, onChanged }) => {
  const { selectedTaskIds, toggleTaskSelection } = useTaskSelection();
  const isSelected = selectedTaskIds.includes(task.id);

  const [openField, setOpenField] = useState<RowField>(null);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [tags, setTags] = useState<Tag[]>(task.tags ?? []);
  const [expanded, setExpanded] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const children = childrenByParent[task.id] ?? [];
  const hasChildren = children.length > 0;

  useEffect(() => {
    if (!openField) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenField(null);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openField]);

  const toggle = (field: RowField) => setOpenField((cur) => (cur === field ? null : field));

  const commitRename = () => {
    const next = titleDraft.trim();
    setRenaming(false);
    if (!next || next === task.title) { setTitleDraft(task.title); return; }
    patchTask(task, { title: next }).then(() => onChanged?.()).catch((e) => {
      console.warn('Failed to rename task', e instanceof Error ? e.message : String(e));
      setTitleDraft(task.title);
    });
  };

  const setPriority = (p: Priority) => {
    setOpenField(null);
    patchTask(task, { priority: p }).then(() => onChanged?.()).catch((e) =>
      console.warn('Failed to set priority', e instanceof Error ? e.message : String(e)));
  };

  const setDueDate = (iso: string | undefined) => {
    setOpenField(null);
    patchTask(task, { dueDate: iso }).then(() => onChanged?.()).catch((e) =>
      console.warn('Failed to set due date', e instanceof Error ? e.message : String(e)));
  };

  const startAddSubtask = () => {
    setOpenField(null);
    setExpanded(true);
    setAddingSubtask(true);
  };

  const createSubtask = async (title: string) => {
    await createTask({
      title,
      projectId: task.projectId,
      status: task.status,
      priority: Priority.Low,
      order: 0,
      parentTaskId: task.id,
    });
    setAddingSubtask(false);
    setExpanded(true);
    onChanged?.();
  };

  const handleDelete = async () => {
    setOpenField(null);
    try {
      const allToDelete = new Map<number, TaskItem>();
      const stack = [task];
      
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (!allToDelete.has(current.id)) {
          allToDelete.set(current.id, current);
          const children = childrenByParent[current.id] || [];
          stack.push(...children);
        }
      }

      let remaining = Array.from(allToDelete.values());
      while (remaining.length > 0) {
        const leaves = remaining.filter(t => {
          const children = childrenByParent[t.id] || [];
          return !children.some(child => remaining.some(r => r.id === child.id));
        });

        await Promise.all(leaves.map(t => deleteTask(t.id)));

        const leafIds = new Set(leaves.map(l => l.id));
        remaining = remaining.filter(t => !leafIds.has(t.id));
      }

      onChanged?.();
    } catch (e) {
      console.warn('Failed to delete task', e instanceof Error ? e.message : String(e));
    }
  };

  const handleTagsChange = (next: Tag[]) => {
    const added = next.filter((n) => !tags.some((t) => t.id === n.id));
    const removed = tags.filter((t) => !next.some((n) => n.id === t.id));
    setTags(next);
    Promise.all([
      ...added.map((t) => addTagToTask(task.id, t.id)),
      ...removed.map((t) => removeTagFromTask(task.id, t.id)),
    ]).then(() => onChanged?.()).catch((e) =>
      console.warn('Failed to update tags', e instanceof Error ? e.message : String(e)));
  };

  const priority = toPriority(task.priority);

  return (
    <>
      <div className={`task-row ${isSelected ? 'selected' : ''}`} ref={rootRef}>
        <div className="task-cell task-name-cell" style={{ paddingLeft: INDENT_BASE + depth * INDENT_STEP }}>
          <div 
            className={`task-row-checkbox ${isSelected ? 'checked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskSelection(task.id);
            }}
          >
            <div className="checkbox-inner">
              {isSelected && <Check size={10} strokeWidth={3} />}
            </div>
          </div>

          <span
            className={`task-expand ${hasChildren ? 'has-children' : ''}`}
            onClick={() => hasChildren && setExpanded((v) => !v)}
          >
            {hasChildren && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </span>

          <button className="task-status-btn" onClick={() => onToggleStatus?.(task.id)}>
            <StatusGlyph />
          </button>

          {renaming ? (
            <input
              className="task-rename-input"
              value={titleDraft}
              autoFocus
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') { setTitleDraft(task.title); setRenaming(false); }
              }}
            />
          ) : (
            <span className="task-title" onDoubleClick={() => { setTitleDraft(task.title); setRenaming(true); }}>
              {task.title}
            </span>
          )}

          {hasChildren && (
            <button className="subtask-count" title={`${children.length} subtask${children.length > 1 ? 's' : ''}`} onClick={() => setExpanded((v) => !v)}>
              <GitBranch size={13} /> {children.length}
            </button>
          )}

          {tags.length > 0 && <TagPills tags={tags} />}

          <div className="task-row-actions">
            <button className="row-action-btn" title="Rename" onClick={() => { setTitleDraft(task.title); setRenaming(true); }}>
              <Pencil size={14} />
            </button>
            <div className="row-action-wrap">
              <button className="row-action-btn" title="Add tag" onClick={() => toggle('tag')}>
                <TagIcon size={14} />
              </button>
              {openField === 'tag' && <TagMenu selected={tags} onChange={handleTagsChange} />}
            </div>
            <button className="row-action-btn" title="Add subtask" onClick={startAddSubtask}>
              <Plus size={15} />
            </button>
          </div>
        </div>

        <div className="task-cell task-assignee-cell">
          <div className="empty-avatar" title="Assign">
            <span className="assignee-icon-circle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
            </span>
          </div>
        </div>

        <div className="task-cell task-date-cell">
          <div className="row-action-wrap">
            {task.dueDate ? (
              <button className="date-value-btn" onClick={() => toggle('dates')}>
                {new Date(task.dueDate).toLocaleDateString()}
              </button>
            ) : (
              <button className="empty-date" onClick={() => toggle('dates')} title="Set due date">
                <Calendar size={16} />
                <span className="mini-plus">+</span>
              </button>
            )}
            {openField === 'dates' && (
              <DateMenu
                value={task.dueDate ? new Date(task.dueDate) : null}
                onSelect={(d) => setDueDate(d.toISOString())}
                onClear={() => setDueDate(undefined)}
              />
            )}
          </div>
        </div>

        <div className="task-cell task-priority-cell">
          <div className="row-action-wrap">
            <button className={`priority-flag priority-${priority}`} onClick={() => toggle('priority')} title="Set priority">
              <Flag size={14} />
            </button>
            {openField === 'priority' && (
              <PriorityMenu
                value={priority !== Priority.Low ? priority : null}
                onSelect={setPriority}
                onClear={() => setPriority(Priority.Low)}
              />
            )}
          </div>
        </div>

        <div className="task-row-more">
          <button className="row-action-btn" title="More" onClick={() => toggle('menu')}>
            <MoreHorizontal size={16} />
          </button>
          {openField === 'menu' && (
            <div className="composer-dropdown">
              <button className="dd-row" onClick={() => { setOpenField(null); setTitleDraft(task.title); setRenaming(true); }}>
                <Pencil size={15} /> <span>Rename</span>
              </button>
              <button className="dd-row" onClick={startAddSubtask}>
                <Plus size={15} /> <span>Add subtask</span>
              </button>
              <div className="dd-divider" />
              <button className="dd-row danger" onClick={handleDelete}>
                <Trash2 size={15} /> <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested subtasks (recursive) */}
      {expanded && children.map((child) => (
        <TaskRow
          key={child.id}
          task={child}
          childrenByParent={childrenByParent}
          depth={depth + 1}
          onToggleStatus={onToggleStatus}
          onChanged={onChanged}
        />
      ))}

      {/* Inline subtask composer */}
      {addingSubtask && (
        <SubtaskComposer
          depth={depth + 1}
          onCancel={() => setAddingSubtask(false)}
          onCreate={createSubtask}
        />
      )}
    </>
  );
};

// ---- Inline subtask composer row ----
const SubtaskComposer: React.FC<{
  depth: number;
  onCancel: () => void;
  onCreate: (title: string) => Promise<void> | void;
}> = ({ depth, onCancel, onCreate }) => {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate(title.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="task-row subtask-composer-row">
      <div className="task-cell task-name-cell" style={{ paddingLeft: INDENT_BASE + depth * INDENT_STEP }}>
        <span className="task-expand" />
        <span className="task-status-btn"><StatusGlyph /></span>
        <input
          className="subtask-composer-input"
          placeholder="Task Name or type '/' for commands"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className="subtask-composer-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary composer-save" onClick={save} disabled={!title.trim() || saving}>
            {saving ? 'Saving' : 'Save'} <CornerDownLeft size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
