"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSpaceStore } from '@/store/useSpaceStore';
import { X, Calendar, Flag, Tag as TagIcon, Users, FileText, CheckCircle, ChevronRight, Play, Paperclip, LayoutGrid, Check } from 'lucide-react';
import { StatusMenu, PriorityMenu, DateMenu, TagMenu, AssigneeMenu, Avatar } from './TaskFieldMenus';
import { PRIORITY_META, Priority, TaskItem, TaskStatus, User, userDisplayName } from '../types';
import { patchTask, addTagToTask, removeTagFromTask, assignUserToTask, removeUserFromTask } from '../api';
import { TaskComments } from '@/features/comments/components/TaskComments';

export const TaskDetailSidebar: React.FC = () => {
  const { detailTaskId, setDetailTaskId, tasksByProjectId, projects, updateTaskLocally, addTaskLocally } = useSpaceStore();
  
  const [openField, setOpenField] = useState<'status' | 'assignee' | 'dates' | 'priority' | 'tags' | null>(null);
  
  // Find the task
  let task: TaskItem | null = null;
  let projectName = '';
  
  for (const projectId in tasksByProjectId) {
    const tasks = tasksByProjectId[projectId];
    const found = tasks.find(t => t.id === detailTaskId);
    if (found) {
      task = found;
      const proj = projects.find(p => p.id === Number(projectId));
      projectName = proj?.name || 'Project';
      break;
    }
  }

  // Ref to handle clicking outside popup menus to close them,
  // but we don't strictly need it if the menus manage their own clicks,
  // however our menus rely on parent state.
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openField) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenField(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openField]);

  // Description draft
  const [descDraft, setDescDraft] = useState(task?.description || '');
  useEffect(() => {
    if (task) setDescDraft(task.description || '');
  }, [task?.description, task?.id]);

  if (!detailTaskId || !task) {
    return null;
  }

  const toggle = (field: 'status' | 'assignee' | 'dates' | 'priority' | 'tags') => 
    setOpenField(cur => cur === field ? null : field);

  // Status mapping
  const statusLabels: Record<TaskStatus, { label: string; color: string; bg: string }> = {
    0: { label: 'TO DO', color: '#b2b2b2', bg: 'transparent' },
    1: { label: 'IN PROGRESS', color: '#2684ff', bg: 'rgba(38, 132, 255, 0.1)' },
    2: { label: 'COMPLETE', color: '#00c875', bg: 'rgba(0, 200, 117, 0.1)' },
  };
  const st = statusLabels[task.status];

  const handleUpdate = (patch: Partial<TaskItem>) => {
    if (!task) return;
    updateTaskLocally(task.id, patch);
    patchTask(task, patch).catch(e => console.error(e));
  };

  const toggleAssignee = (user: User) => {
    if (!task) return;
    const assignees = task.assignees ?? [];
    const isAssigned = assignees.some((a) => a.id === user.id);
    const next = isAssigned ? assignees.filter((a) => a.id !== user.id) : [...assignees, user];
    updateTaskLocally(task.id, { assignees: next });
    (isAssigned ? removeUserFromTask(task.id, user.id) : assignUserToTask(task.id, user.id)).catch((e) => {
      console.warn('Failed to update assignees', e instanceof Error ? e.message : String(e));
      updateTaskLocally(task.id, { assignees });
    });
  };

  const handleDescBlur = () => {
    if (descDraft !== task.description) {
      handleUpdate({ description: descDraft });
    }
  };

  return (
    <>
      <div className="task-detail-backdrop" onClick={() => setDetailTaskId(null)} />
      <div className="task-detail-sidebar">
        
        <div className="tds-header">
          <div className="tds-breadcrumb">
            <LayoutGrid size={14} /> {projectName} <ChevronRight size={14} /> Task {task.id}
          </div>
          <button className="tds-close-btn" onClick={() => setDetailTaskId(null)}>
            <X size={20} />
          </button>
        </div>

        <div className="tds-content" ref={rootRef}>
          <div className="tds-title-section">
            <h1 className="tds-title">{task.title}</h1>
          </div>

          <div className="tds-fields-grid">
            {/* Status (duplicate for the grid view like clickup) */}
            <div className="tds-field-row">
              <div className="tds-field-label"><CheckCircle size={14} /> Status</div>
              <div className="tds-field-value">
                <div className="tds-status-group">
                  <div className="tds-status-picker" onClick={() => toggle('status')} style={{ borderColor: st.color }}>
                    <div className="tds-status-label" style={{ color: st.color, backgroundColor: st.bg }}>
                      {st.label}
                    </div>
                    <div className="tds-status-caret">
                      <ChevronRight size={14} style={{ transform: openField === 'status' ? 'rotate(90deg)' : 'none', color: st.color }} />
                    </div>
                  </div>
                  {task.status !== 2 && (
                    <button className="tds-complete-btn" onClick={() => handleUpdate({ status: 2 })} title="Mark Complete">
                      <Check size={16} strokeWidth={3} />
                    </button>
                  )}
                </div>
                {openField === 'status' && (
                  <div className="popup-anchor bottom-left" style={{ marginTop: 8 }}>
                    <StatusMenu 
                      value={task.status} 
                      onSelect={(s) => { handleUpdate({ status: s }); setOpenField(null); }} 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Assignee */}
            <div className="tds-field-row">
              <div className="tds-field-label"><Users size={14} /> Assignees</div>
              <div className="tds-field-value">
                <button className="tds-field-btn" onClick={() => toggle('assignee')}>
                  {task.assignees && task.assignees.length > 0 ? (
                    <div className="tds-assignees-list">
                      {task.assignees.map((u) => (
                        <span key={u.id} className="tds-assignee-chip">
                          <Avatar user={u} size="sm" title={false} /> {userDisplayName(u)}
                        </span>
                      ))}
                    </div>
                  ) : 'Empty'}
                </button>
                {openField === 'assignee' && (
                  <div className="popup-anchor bottom-left">
                    <AssigneeMenu projectId={task.projectId} selected={task.assignees ?? []} onToggle={toggleAssignee} />
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="tds-field-row">
              <div className="tds-field-label"><Calendar size={14} /> Dates</div>
              <div className="tds-field-value">
                <button className="tds-field-btn" onClick={() => toggle('dates')}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Empty'}
                </button>
                {openField === 'dates' && (
                  <div className="popup-anchor bottom-left">
                    <DateMenu 
                      value={task.dueDate ? new Date(task.dueDate) : null}
                      onSelect={(d) => { handleUpdate({ dueDate: d.toISOString() }); setOpenField(null); }}
                      onClear={() => { handleUpdate({ dueDate: undefined }); setOpenField(null); }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Priority */}
            <div className="tds-field-row">
              <div className="tds-field-label"><Flag size={14} /> Priority</div>
              <div className="tds-field-value">
                <button className="tds-field-btn" onClick={() => toggle('priority')}>
                  {task.priority !== Priority.Low ? (
                    <span style={{ color: PRIORITY_META[task.priority].color }}>
                      <Flag size={14} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} />
                      {PRIORITY_META[task.priority].label}
                    </span>
                  ) : 'Empty'}
                </button>
                {openField === 'priority' && (
                  <div className="popup-anchor bottom-left">
                    <PriorityMenu 
                      value={task.priority !== Priority.Low ? task.priority : null}
                      onSelect={(p) => { handleUpdate({ priority: p }); setOpenField(null); }}
                      onClear={() => { handleUpdate({ priority: Priority.Low }); setOpenField(null); }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="tds-field-row">
              <div className="tds-field-label"><TagIcon size={14} /> Tags</div>
              <div className="tds-field-value">
                <button className="tds-field-btn" onClick={() => toggle('tags')}>
                  {task.tags && task.tags.length > 0 ? (
                    <div className="tds-tags-list">
                      {task.tags.map(t => (
                        <span key={t.id} className="tds-tag-pill" style={{ backgroundColor: t.colorHex }}>{t.name}</span>
                      ))}
                    </div>
                  ) : 'Empty'}
                </button>
                {openField === 'tags' && (
                  <div className="popup-anchor bottom-left">
                    <TagMenu 
                      selected={task.tags || []}
                      onChange={(next) => {
                        const tags = task!.tags || [];
                        const added = next.filter(n => !tags.some(t => t.id === n.id));
                        const removed = tags.filter(t => !next.some(n => n.id === t.id));
                        
                        updateTaskLocally(task!.id, { tags: next });
                        
                        added.forEach(t => addTagToTask(task!.id, t.id));
                        removed.forEach(t => removeTagFromTask(task!.id, t.id));
                        
                        setOpenField(null);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="tds-divider" />

          {/* Description */}
          <div className="tds-description-section">
            <textarea
              className="tds-desc-textarea"
              placeholder="Add description..."
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={handleDescBlur}
            />
          </div>

          <div className="tds-divider" />

          {/* Attachments Section */}
          <div className="tds-attachments-section">
            <h3>Attachments</h3>
            <div className="tds-attachments-empty">
              <div className="tds-attachments-icon"><Paperclip size={20} /></div>
              <div className="tds-attachments-text">
                <span className="bold">Click to browse</span> or drag and drop files here
              </div>
              <input type="file" className="tds-file-input" title="Upload attachment" />
            </div>
          </div>
          <div className="tds-divider" />

          {/* Comments Section */}
          <TaskComments taskId={task.id} projectId={task.projectId} />

        </div>
      </div>
    </>
  );
};
