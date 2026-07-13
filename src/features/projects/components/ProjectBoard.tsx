"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { getProjectById, getProjectsBySpace } from '@/features/projects/api';
import { getTasksByProject, patchTask, createTask, addTagToTask, removeTagFromTask, assignUserToTask } from '@/features/tasks/api';
import { ComposerResult } from '@/features/tasks/components/InlineTaskComposer';
import { Project } from '@/features/projects/types';
import { TaskItem, TaskStatus } from '@/features/tasks/types';
import { SpaceListView } from '@/features/spaces/components/SpaceListView';
import { BoardView } from '@/features/tasks/components/BoardView';
import { CalendarView } from '@/features/tasks/components/CalendarView';
import { LayoutGrid, List as ListIcon, Columns, Calendar, Plus, MoreHorizontal, Share2 } from 'lucide-react';
import { useSpaceStore } from '@/store/useSpaceStore';
import { InviteMemberModal } from '@/features/invitations/components/InviteMemberModal';
import { InvitationTargetType } from '@/features/invitations/types';

type ProjectView = 'list' | 'board' | 'calendar';

export const ProjectBoard = ({ projectId, spaceId }: { projectId: number; spaceId?: number }) => {
  const { projects, tasksByProjectId, setProjectLocally, setTasksForProject, addTaskLocally, updateTaskLocally } = useSpaceStore();
  const project = projects.find((p) => p.id === projectId) || null;
  const tasks = tasksByProjectId[projectId] || [];
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<ProjectView>('list');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    // Project details are a best-effort fetch: the backend does not (yet) expose
    // GET /Projects/{id}, so fall back to a minimal project rather than blocking the board.
    try {
      if (spaceId) {
        const spaceProjects = await getProjectsBySpace(spaceId);
        const foundProject = spaceProjects.find((p) => p.id === projectId);
        if (foundProject) {
          setProjectLocally(foundProject);
        } else {
          throw new Error(`Project ${projectId} not found in space ${spaceId}`);
        }
      } else {
        const fetchedProject = await getProjectById(projectId);
        setProjectLocally(fetchedProject);
      }
    } catch (error) {
      console.warn("Could not load project details", error instanceof Error ? error.message : String(error));
      setProjectLocally({ id: projectId, name: `Project #${projectId}`, spaceId: spaceId || 0 });
    }

    try {
      const fetchedTasks = await getTasksByProject(projectId);
      setTasksForProject(projectId, fetchedTasks);
    } catch (error) {
      console.warn("Failed to load project tasks", error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, spaceId, setProjectLocally, setTasksForProject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create a task inline from a board column. Persists title/priority/dueDate/status,
  // then refetches so the new card appears in the right column.
  const handleCreateTask = useCallback(async (data: ComposerResult, status: TaskStatus) => {
    const created = await createTask({
      title: data.title,
      priority: data.priority,
      dueDate: data.dueDate,
      status,
      projectId,
      order: 0,
    });
    // Task create has no tags/assignees field — attach the selected ones after creation.
    for (const tagId of data.tagIds) {
      try {
        await addTagToTask(created.id, tagId);
      } catch (e) {
        console.warn('Failed to attach tag', e instanceof Error ? e.message : String(e));
      }
    }
    for (const userId of data.assigneeIds) {
      try {
        await assignUserToTask(created.id, userId);
      } catch (e) {
        console.warn('Failed to assign user', e instanceof Error ? e.message : String(e));
      }
    }
    await fetchData();
  }, [projectId, fetchData]);

  // Update a task's fields (priority / due date) inline from a board card.
  // Optimistic, with refetch on failure.
  const handleUpdateTask = useCallback((taskId: number, patch: { priority?: number; dueDate?: string }) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    updateTaskLocally(taskId, patch);

    patchTask(task, patch).catch((error) => {
      console.warn("Failed to update task", error instanceof Error ? error.message : String(error));
      fetchData(); // revert to server truth
    });
  }, [tasks, fetchData, updateTaskLocally]);

  // Attach an existing/just-created tag to a task (board card). Persists, then refetches
  // so the card reflects the server's tag list.
  const handleAddTag = useCallback((taskId: number, tagId: number) => {
    addTagToTask(taskId, tagId)
      .then(() => fetchData())
      .catch((error) => console.warn("Failed to attach tag", error instanceof Error ? error.message : String(error)));
  }, [fetchData]);

  // Detach a tag from a task (board card). Persists, then refetches.
  const handleRemoveTag = useCallback((taskId: number, tagId: number) => {
    removeTagFromTask(taskId, tagId)
      .then(() => fetchData())
      .catch((error) => console.warn("Failed to remove tag", error instanceof Error ? error.message : String(error)));
  }, [fetchData]);

  // Move a task to another status (drag & drop on the board). Optimistic, with refetch on failure.
  const handleMoveTask = useCallback((taskId: number, toStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === toStatus) return;

    updateTaskLocally(taskId, { status: toStatus });

    patchTask(task, { status: toStatus }).catch((error) => {
      console.warn("Failed to update task status", error instanceof Error ? error.message : String(error));
      fetchData(); // revert to server truth
    });
  }, [tasks, fetchData, updateTaskLocally]);

  if (isLoading) {
    return <div className="space-loading" style={{ padding: '24px' }}>Loading Project...</div>;
  }

  if (!project) {
    return <div style={{ padding: '24px' }}>Project not found.</div>;
  }

  return (
    <div className="space-page">
      <div className="space-view-container">
        {/* Project Header using the exact same style as Space Header */}
        <div className="space-header">
          <div className="space-header-top">
            <div className="space-title-container">
              <div className="space-icon" style={{ backgroundColor: project.color || 'var(--accent-color)' }}>
                <LayoutGrid size={16} color="white" />
              </div>
              <h1 className="space-title">{project.name}</h1>
              <button className="icon-btn" style={{marginLeft: '8px'}}><MoreHorizontal size={18} /></button>
            </div>
            <div className="space-header-actions">
              <div className="avatar-group" style={{marginRight: '12px'}}>
                <div className="avatar" style={{ backgroundColor: '#ff7b72', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 500, fontSize: '12px' }}>A</div>
              </div>
              <button 
                className="btn-secondary share-btn" 
                onClick={() => setIsInviteModalOpen(true)}
                style={{display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px'}}
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
          
          {isInviteModalOpen && (
            <InviteMemberModal 
              targetType={InvitationTargetType.Project} 
              targetId={project.id} 
              targetName={project.name}
              onClose={() => setIsInviteModalOpen(false)} 
            />
          )}
          
          <div className="space-tabs">
            <button className={`space-tab ${activeView === 'list' ? 'active' : ''}`} onClick={() => setActiveView('list')}>
              <ListIcon size={14} />
              List
            </button>
            <button className={`space-tab ${activeView === 'board' ? 'active' : ''}`} onClick={() => setActiveView('board')}>
              <Columns size={14} />
              Board
            </button>
            <button className={`space-tab ${activeView === 'calendar' ? 'active' : ''}`} onClick={() => setActiveView('calendar')}>
              <Calendar size={14} />
              Calendar
            </button>
            <div style={{width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 8px'}} />
            <button className="space-tab add-tab" style={{color: 'var(--text-secondary)'}}>
              <Plus size={14} />
              View
            </button>
          </div>
        </div>

        {activeView === 'list' && (
          <SpaceListView
            projects={[project]}
            tasksByProjectId={{ [project.id]: tasks }}
          />
        )}

        {activeView === 'board' && (
          <BoardView
            tasks={tasks}
            projectId={project.id}
            projectName={project.name}
            onMoveTask={handleMoveTask}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        )}

        {activeView === 'calendar' && (
          <CalendarView tasks={tasks} />
        )}
      </div>
    </div>
  );
};
