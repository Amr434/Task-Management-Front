"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { getPersonalProject } from '@/features/projects/api';
import { getTasksByProject, createTask, addTagToTask, assignUserToTask } from '@/features/tasks/api';
import { Project } from '@/features/projects/types';
import { TaskItem, TaskStatus } from '@/features/tasks/types';
import { TaskRow } from '@/features/tasks/components/TaskRow';
import { InlineTaskComposer, ComposerResult } from '@/features/tasks/components/InlineTaskComposer';
import { useColumnGridTemplate } from '@/features/tasks/hooks/useColumnGridTemplate';
import { useSpaceStore } from '@/store/useSpaceStore';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

const EMPTY_TASKS: TaskItem[] = [];

export default function PersonalListPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);

  const currentUser = useAuthStore((s) => s.user);
  const setTasksForProject = useSpaceStore((s) => s.setTasksForProject);
  const setProjectLocally = useSpaceStore((s) => s.setProjectLocally);
  const tasks = useSpaceStore((s) => (project ? s.tasksByProjectId[project.id] ?? EMPTY_TASKS : EMPTY_TASKS));

  const visibleColumns = useSpaceStore((s) => s.visibleColumns);
  const gridTemplateColumns = useColumnGridTemplate();

  useEffect(() => {
    getPersonalProject()
      .then(async (p) => {
        setProject(p);
        setProjectLocally(p); // so the task detail sidebar can show the breadcrumb
        const projectTasks = await getTasksByProject(p.id);
        setTasksForProject(p.id, projectTasks);
      })
      .catch((err) => console.warn('Failed to load personal list', err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [setTasksForProject, setProjectLocally]);

  const { rootTasks, childrenByParent } = useMemo(() => {
    const byParent: Record<number, TaskItem[]> = {};
    const root: TaskItem[] = [];
    for (const t of tasks) {
      if (t.parentTaskId != null) (byParent[t.parentTaskId] ??= []).push(t);
      else root.push(t);
    }
    return { rootTasks: root, childrenByParent: byParent };
  }, [tasks]);

  // ClickUp assigns Personal List tasks to you by default, so they surface
  // in "Assigned to me" and "Today & Overdue" too.
  const handleCreateTask = useCallback(async (data: ComposerResult) => {
    if (!project) return;
    const created = await createTask({
      title: data.title,
      priority: data.priority,
      dueDate: data.dueDate,
      status: TaskStatus.ToDo,
      projectId: project.id,
      order: 0,
    });
    for (const tagId of data.tagIds) {
      try { await addTagToTask(created.id, tagId); }
      catch (e) { console.warn('Failed to attach tag', e instanceof Error ? e.message : String(e)); }
    }
    const assigneeIds = data.assigneeIds.length > 0
      ? data.assigneeIds
      : currentUser ? [currentUser.id] : [];
    for (const userId of assigneeIds) {
      try { await assignUserToTask(created.id, userId); }
      catch (e) { console.warn('Failed to assign user', e instanceof Error ? e.message : String(e)); }
    }
    const projectTasks = await getTasksByProject(project.id);
    setTasksForProject(project.id, projectTasks);
    setComposing(false);
  }, [project, currentUser, setTasksForProject]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Personal List <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }} title="Only you can see this list">🔒</span>
        </h1>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setComposing(true)}>
          <Plus size={15} /> Add Task
        </button>
      </div>

      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading tasks...</div>
        ) : !project ? (
          <div style={{ color: 'var(--text-secondary)' }}>Could not load your personal list.</div>
        ) : (
          <div className="list-tasks-container">
            <div className="table-header" style={{ gridTemplateColumns }}>
              <div className="th-cell th-name">Name</div>
              {visibleColumns.assignee && <div className="th-cell th-assignee">Assignee</div>}
              {visibleColumns.dueDate && <div className="th-cell th-due">Due date</div>}
              {visibleColumns.priority && <div className="th-cell th-priority">Priority</div>}
            </div>

            {rootTasks.map((task) => (
              <TaskRow key={task.id} task={task} childrenByParent={childrenByParent} />
            ))}

            {rootTasks.length === 0 && !composing && (
              <div style={{ padding: '24px 8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Your private tasks live here — only you can see them.
              </div>
            )}

            {composing ? (
              <InlineTaskComposer
                projectId={project.id}
                projectName="Personal List"
                onCreate={handleCreateTask}
                onCancel={() => setComposing(false)}
              />
            ) : (
              <div className="nav-item add-project-row" style={{ marginTop: '4px' }} onClick={() => setComposing(true)}>
                <Plus size={14} /> <span>Add Task</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
