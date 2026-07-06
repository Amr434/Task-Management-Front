import React, { useState, useEffect, useRef } from 'react';
import { X, LayoutGrid, ChevronDown, User, Calendar, Flag, Tag as TagIcon, Paperclip, CornerDownLeft } from 'lucide-react';
import { Project } from '@/features/projects/types';
import { Space } from '@/features/spaces/types';
import { getSpaces } from '@/features/spaces/api';
import { getProjectsBySpace } from '@/features/projects/api';
import { createTask, addTagToTask } from '../api';
import { Priority, PRIORITY_META, Tag } from '../types';
import { useSpaceStore } from '@/store/useSpaceStore';
import { PriorityMenu, AssigneeMenu, DateMenu, TagMenu, TagPills, shortDate } from './TaskFieldMenus';

interface CreateTaskModalProps {
  onClose: () => void;
  projects?: Project[];
  defaultProjectId?: number;
}

type Menu = 'project' | 'assignee' | 'dates' | 'priority' | 'tags' | null;

interface SpaceGroup {
  space: Space;
  projects: Project[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, projects = [], defaultProjectId }) => {
  const { addTaskLocally } = useSpaceStore();

  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    defaultProjectId ?? (projects.length > 0 ? projects[0].id : null)
  );

  const [priority, setPriority] = useState<Priority | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  const [openMenu, setOpenMenu] = useState<Menu>(null);
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState<SpaceGroup[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load every space and its projects so the picker can choose project + space.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const spaces = await getSpaces();
        const result: SpaceGroup[] = [];
        for (const space of spaces) {
          const spaceProjects = await getProjectsBySpace(space.id).catch(() => []);
          result.push({ space, projects: spaceProjects });
        }
        if (cancelled) return;
        setGroups(result);
        // Default the selection to the first available project if none chosen yet.
        if (selectedProjectId == null) {
          const first = result.find((g) => g.projects.length > 0)?.projects[0];
          if (first) setSelectedProjectId(first.id);
        }
      } catch (e) {
        console.warn('Failed to load spaces/projects', e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close any open menu on outside click.
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.tm-menu-wrap')) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openMenu]);

  const allProjects = groups.flatMap((g) => g.projects);
  const selectedProject =
    allProjects.find((p) => p.id === selectedProjectId) ??
    projects.find((p) => p.id === selectedProjectId) ??
    null;

  const toggle = (menu: Menu) => setOpenMenu((cur) => (cur === menu ? null : menu));

  const handleCreateTask = async () => {
    if (!taskName.trim()) { alert('Task name is required'); return; }
    if (!selectedProjectId) { alert('Please select a project to add the task to.'); return; }

    try {
      setIsSubmitting(true);
      const created = await createTask({
        title: taskName.trim(),
        description,
        projectId: selectedProjectId,
        status: 0, // TO DO
        priority: priority ?? Priority.Low,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        order: 0,
      });

      // Tasks are created without tags — attach the selected ones afterwards.
      for (const tag of tags) {
        try { await addTagToTask(created.id, tag.id); } catch (e) {
          console.warn('Failed to attach tag', e instanceof Error ? e.message : String(e));
        }
      }

      addTaskLocally({ ...created, tags });
      onClose();
    } catch (error) {
      console.error('Failed to create task', error);
      alert('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop task-modal-backdrop" onClick={onClose}>
      <div className="task-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header — single "Task" type */}
        <div className="task-modal-header">
          <div className="task-modal-tabs">
            <button className="task-tab active">Task</button>
          </div>
          <div className="task-modal-header-actions">
            <button className="icon-btn" onClick={onClose} title="Close"><X size={16} /></button>
          </div>
        </div>

        {/* Project / space picker */}
        <div className="task-location-selectors">
          <div className="tm-menu-wrap" style={{ position: 'relative' }}>
            <button className="location-btn project-selector" onClick={() => toggle('project')}>
              <LayoutGrid size={14} className="text-secondary" />
              <span>{selectedProject ? selectedProject.name : 'Select Project'}</span>
              <ChevronDown size={14} className="text-secondary" />
            </button>

            {openMenu === 'project' && (
              <div className="custom-dropdown-menu">
                <div className="dropdown-search-wrapper">
                  <svg className="dropdown-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <input
                    type="text"
                    className="dropdown-search-input"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>

                {groups.length === 0 && <div className="dd-empty">Loading…</div>}

                {groups.map((group) => {
                  const visible = group.projects.filter((p) =>
                    p.name.toLowerCase().includes(search.toLowerCase())
                  );
                  if (visible.length === 0) return null;
                  return (
                    <div className="dropdown-section" key={group.space.id}>
                      <div className="dropdown-space-header">
                        <div className="space-header-icon" style={{ background: group.space.color || '#3e82f7' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <span>{group.space.name}</span>
                      </div>
                      {visible.map((project) => (
                        <div
                          key={project.id}
                          className={`dropdown-item space-indented ${selectedProjectId === project.id ? 'selected' : ''}`}
                          onClick={() => { setSelectedProjectId(project.id); setOpenMenu(null); setSearch(''); }}
                        >
                          <LayoutGrid size={14} className="item-icon" />
                          <span className="item-name">{project.name}</span>
                          {selectedProjectId === project.id && (
                            <svg className="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Task name */}
        <div className="task-name-input-wrapper">
          <input
            type="text"
            className="task-name-input"
            placeholder="Task Name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTask(); }}
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="task-desc-input-wrapper">
          <textarea
            className="task-desc-input"
            placeholder="Add description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Action toolbar — interactive */}
        <div className="task-action-toolbar">
          <button className="toolbar-btn status-btn">
            <span className="status-dot"></span> TO DO
          </button>

          {/* Assignee (visual — no backend field) */}
          <div className="tm-menu-wrap">
            <button className={`toolbar-btn ${assignedToMe ? 'filled' : ''}`} onClick={() => toggle('assignee')}>
              {assignedToMe ? <span className="dd-avatar sm">AK</span> : <User size={14} className="text-secondary" />}
              {assignedToMe ? 'Me' : 'Assignee'}
            </button>
            {openMenu === 'assignee' && (
              <AssigneeMenu
                assigned={assignedToMe}
                onAssign={() => { setAssignedToMe(true); setOpenMenu(null); }}
                onClear={() => { setAssignedToMe(false); setOpenMenu(null); }}
              />
            )}
          </div>

          {/* Due date */}
          <div className="tm-menu-wrap">
            <button className={`toolbar-btn ${dueDate ? 'filled' : ''}`} onClick={() => toggle('dates')}>
              <Calendar size={14} className="text-secondary" /> {dueDate ? shortDate(dueDate) : 'Due date'}
            </button>
            {openMenu === 'dates' && (
              <DateMenu
                value={dueDate}
                onSelect={(d) => { setDueDate(d); setOpenMenu(null); }}
                onClear={() => { setDueDate(null); setOpenMenu(null); }}
              />
            )}
          </div>

          {/* Priority */}
          <div className="tm-menu-wrap">
            <button className={`toolbar-btn ${priority !== null ? 'filled' : ''}`} onClick={() => toggle('priority')}>
              <Flag size={14} style={{ color: priority !== null ? PRIORITY_META[priority].color : undefined }} />
              {priority !== null ? PRIORITY_META[priority].label : 'Priority'}
            </button>
            {openMenu === 'priority' && (
              <PriorityMenu
                value={priority}
                onSelect={(p) => { setPriority(p); setOpenMenu(null); }}
                onClear={() => { setPriority(null); setOpenMenu(null); }}
              />
            )}
          </div>

          {/* Tags */}
          <div className="tm-menu-wrap">
            <button className={`toolbar-btn ${tags.length ? 'filled' : ''}`} onClick={() => toggle('tags')}>
              <TagIcon size={14} className="text-secondary" />
              {tags.length ? <TagPills tags={tags} max={3} /> : 'Tags'}
            </button>
            {openMenu === 'tags' && <TagMenu selected={tags} onChange={setTags} />}
          </div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="task-attachments">
            {attachments.map((file, i) => (
              <span key={i} className="attachment-chip">
                <Paperclip size={12} /> {file.name}
                <button onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="task-modal-footer">
          <div className="footer-left" />
          <div className="footer-right">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
                e.target.value = '';
              }}
            />
            <button className="icon-btn attachment-btn" title="Add attachment" onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={16} />
            </button>
            <button className="btn-primary create-btn-main" onClick={handleCreateTask} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : <>Create Task <CornerDownLeft size={13} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
