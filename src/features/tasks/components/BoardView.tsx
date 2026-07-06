"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Plus, Flag, Calendar, MoreHorizontal, ChevronDown, ChevronRight, UserCircle2, Tag as TagIcon, AlignLeft } from 'lucide-react';
import { TaskItem, priorityMeta, TaskStatus, Priority, Tag } from '../types';
import { InlineTaskComposer, ComposerResult } from './InlineTaskComposer';
import { PriorityMenu, AssigneeMenu, DateMenu, TagMenu, TagPills } from './TaskFieldMenus';
import { useSpaceStore } from '@/store/useSpaceStore';

export interface TaskPatch {
  priority?: number;
  dueDate?: string;
}

interface BoardViewProps {
  tasks: TaskItem[];
  projectName: string;
  onMoveTask: (taskId: number, toStatus: TaskStatus) => void;
  onCreateTask: (data: ComposerResult, status: TaskStatus) => Promise<void> | void;
  onUpdateTask: (taskId: number, patch: TaskPatch) => void;
  onAddTag: (taskId: number, tagId: number) => void;
  onRemoveTag: (taskId: number, tagId: number) => void;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.ToDo: return '#87909e';
    case TaskStatus.InProgress: return '#2684ff';
    case TaskStatus.Complete: return '#00c875';
    default: return '#7b68ee';
  }
};

const getStatusName = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.ToDo: return 'TO DO';
    case TaskStatus.InProgress: return 'IN PROGRESS';
    case TaskStatus.Complete: return 'COMPLETE';
    default: return 'UNKNOWN';
  }
};

// Relative due-date label ("Today", "Tomorrow", "5 days ago", or a short date).
// Anything in the past is flagged overdue so it can render red.
const formatDue = (iso: string): { label: string; overdue: boolean } => {
  const due = new Date(iso); due.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return { label: 'Today', overdue: false };
  if (diff === 1) return { label: 'Tomorrow', overdue: false };
  if (diff === -1) return { label: 'Yesterday', overdue: true };
  if (diff < -1) return { label: `${-diff} days ago`, overdue: true };
  if (diff > 1 && diff < 7) return { label: `${diff} days`, overdue: false };
  return { label: due.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), overdue: false };
};

type CardField = 'assignee' | 'dates' | 'priority' | 'tag' | null;

const TaskCard: React.FC<{
  task: TaskItem;
  onUpdate: (taskId: number, patch: TaskPatch) => void;
  onAddTag: (taskId: number, tagId: number) => void;
  onRemoveTag: (taskId: number, tagId: number) => void;
}> = ({ task, onUpdate, onAddTag, onRemoveTag }) => {
  const prioritySet = task.priority !== Priority.Low;
  const priority = priorityMeta(task.priority);
  const due = task.dueDate ? formatDue(task.dueDate) : null;

  // Assignee is visual-only (no backend field). Tags are DB-backed: additions
  // persist via onAddTag; removals are local (backend has no detach endpoint).
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [openTagMenu, setOpenTagMenu] = useState(false);
  const tags = task.tags ?? [];
  const [openField, setOpenField] = useState<CardField>(null);

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openField) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenField(null);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openField]);

  const toggle = (field: CardField) => setOpenField((cur) => (cur === field ? null : field));

  return (
    <div
      className={`board-card ${task.status === TaskStatus.Complete ? 'completed' : ''}`}
      ref={rootRef}
      draggable={!openField}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/task-id', String(task.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => useSpaceStore.getState().setDetailTaskId(task.id)}
    >
      <div className="board-card-title">{task.title}</div>

      {task.description && (
        <div className="board-card-desc-indicator" title="Has description">
          <AlignLeft size={15} />
        </div>
      )}

      <div className="board-card-chips">
        {/* Assignee (local/visual only) */}
        <div className="board-chip-wrap">
          <button className={`board-chip ${assignedToMe ? '' : 'icon-only'}`} title="Assign" onClick={() => toggle('assignee')}>
            {assignedToMe ? <><span className="chip-avatar">AK</span> Me</> : <UserCircle2 size={17} />}
          </button>
          {openField === 'assignee' && (
            <AssigneeMenu
              assigned={assignedToMe}
              onAssign={() => { setAssignedToMe(true); setOpenField(null); }}
              onClear={() => { setAssignedToMe(false); setOpenField(null); }}
            />
          )}
        </div>

        {/* Due date */}
        <div className="board-chip-wrap">
          {due ? (
            <button className={`board-chip ${due.overdue ? 'overdue' : ''}`} title="Due date" onClick={() => toggle('dates')}>
              <Calendar size={14} /> {due.label}
            </button>
          ) : (
            <button className="board-chip icon-only" title="Add date" onClick={() => toggle('dates')}>
              <Calendar size={15} />
            </button>
          )}
          {openField === 'dates' && (
            <DateMenu
              value={task.dueDate ? new Date(task.dueDate) : null}
              onSelect={(d) => { onUpdate(task.id, { dueDate: d.toISOString() }); setOpenField(null); }}
              onClear={() => { onUpdate(task.id, { dueDate: undefined }); setOpenField(null); }}
            />
          )}
        </div>

        {/* Priority (Low is treated as "unset" and shows the placeholder flag) */}
        <div className="board-chip-wrap">
          {prioritySet ? (
            <button className="board-chip" title={`${priority.label} priority`} onClick={() => toggle('priority')}>
              <Flag size={14} style={{ color: priority.color }} /> {priority.label}
            </button>
          ) : (
            <button className="board-chip icon-only" title="Set priority" onClick={() => toggle('priority')}>
              <Flag size={15} />
            </button>
          )}
          {openField === 'priority' && (
            <PriorityMenu
              value={prioritySet ? task.priority : null}
              onSelect={(p) => { onUpdate(task.id, { priority: p }); setOpenField(null); }}
              onClear={() => { onUpdate(task.id, { priority: Priority.Low }); setOpenField(null); }}
            />
          )}
        </div>

        {/* Tags — additions persist to the backend; removals are local only. */}
        <div className="board-chip-wrap">
          {tags.length > 0 ? (
            <button className="board-chip tag-pills-chip" title={tags.map((t) => t.name).join(', ')} onClick={() => toggle('tag')}>
              <TagPills tags={tags} />
            </button>
          ) : (
            <button className="board-chip icon-only" title="Add tag" onClick={() => toggle('tag')}>
              <TagIcon size={15} />
            </button>
          )}
          {openField === 'tag' && (
            <TagMenu
              selected={tags}
              onChange={(next: Tag[]) => {
                const added = next.filter((n) => !tags.some((t) => t.id === n.id));
                const removed = tags.filter((t) => !next.some((n) => n.id === t.id));
    
                // We expect the parent to optimistic update or refresh.
                // In this codebase, the parent (ProjectBoard) has onAddTag/onRemoveTag callbacks.
                added.forEach(t => onAddTag(task.id, t.id));
                removed.forEach(t => onRemoveTag(task.id, t.id));
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const BoardView: React.FC<BoardViewProps> = ({ tasks, projectName, onMoveTask, onCreateTask, onUpdateTask, onAddTag, onRemoveTag }) => {
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [composerStatus, setComposerStatus] = useState<TaskStatus | null>(null);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const statuses = [TaskStatus.ToDo, TaskStatus.InProgress, TaskStatus.Complete];

  return (
    <div className="board-view">
      {statuses.map((status) => {
        const columnTasks = tasks.filter(t => t.status === status);
        const color = getStatusColor(status);
        const name = getStatusName(status);
        const isCollapsed = !!collapsed[status];
        const isComposing = composerStatus === status;

        if (isCollapsed) {
          return (
            <div key={status} className="board-column collapsed">
              <div className="board-column-header collapsed-header">
                <button className="board-col-action" onClick={() => setCollapsed(p => ({ ...p, [status]: false }))} title="Expand">
                  <ChevronRight size={16} />
                </button>
                <span className="board-column-badge" style={{ backgroundColor: color }}>{name}</span>
                <span className="board-column-count">{columnTasks.length}</span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={status}
            className={`board-column ${dragOverStatus === status ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
            onDragLeave={() => setDragOverStatus((cur) => (cur === status ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStatus(null);
              const taskId = parseInt(e.dataTransfer.getData('text/task-id'), 10);
              if (!isNaN(taskId)) onMoveTask(taskId, status);
            }}
          >
            <div className="board-column-header">
              <span className="board-column-badge" style={{ backgroundColor: color }}>
                {name}
              </span>
              <span className="board-column-count">{columnTasks.length}</span>
              <div className="board-column-actions">
                <button className="board-col-action" onClick={() => setCollapsed(p => ({ ...p, [status]: true }))} title="Collapse">
                  <ChevronDown size={16} />
                </button>
                <button className="board-col-action" title="More options">
                  <MoreHorizontal size={16} />
                </button>
                <button className="board-col-action" onClick={() => setComposerStatus(status)} title="Add task">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="board-column-body">
              {isComposing && (
                <InlineTaskComposer
                  projectName={projectName}
                  onCancel={() => setComposerStatus(null)}
                  onCreate={async (data) => {
                    await onCreateTask(data, status);
                    setComposerStatus(null);
                  }}
                />
              )}
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={onUpdateTask} onAddTag={onAddTag} onRemoveTag={onRemoveTag} />
              ))}
            </div>

            {!isComposing && (
              <button className="board-add-card" onClick={() => setComposerStatus(status)}>
                <Plus size={14} /> Add Task
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
