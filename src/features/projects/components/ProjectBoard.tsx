"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { getProjectById, getProjectsBySpace } from '@/features/projects/api';
import { getTasksByProject, patchTask } from '@/features/tasks/api';
import { Project } from '@/features/projects/types';
import { TaskItem, TaskStatus } from '@/features/tasks/types';
import { SpaceListView } from '@/features/spaces/components/SpaceListView';
import { BoardView } from '@/features/tasks/components/BoardView';
import { CalendarView } from '@/features/tasks/components/CalendarView';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { LayoutGrid, List as ListIcon, Columns, Calendar, Plus, MoreHorizontal, Share2 } from 'lucide-react';

type ProjectView = 'list' | 'board' | 'calendar';

export const ProjectBoard = ({ projectId, spaceId }: { projectId: number; spaceId?: number }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<ProjectView>('list');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    // Project details are a best-effort fetch: the backend does not (yet) expose
    // GET /Projects/{id}, so fall back to a minimal project rather than blocking the board.
    try {
      if (spaceId) {
        const spaceProjects = await getProjectsBySpace(spaceId);
        const foundProject = spaceProjects.find((p) => p.id === projectId);
        if (foundProject) {
          setProject(foundProject);
        } else {
          throw new Error(`Project ${projectId} not found in space ${spaceId}`);
        }
      } else {
        const fetchedProject = await getProjectById(projectId);
        setProject(fetchedProject);
      }
    } catch (error) {
      console.warn("Could not load project details", error instanceof Error ? error.message : String(error));
      setProject({ id: projectId, name: `Project #${projectId}`, spaceId: spaceId || 0 });
    }

    try {
      const fetchedTasks = await getTasksByProject(projectId);
      setTasks(fetchedTasks);
    } catch (error) {
      console.warn("Failed to load project tasks", error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Move a task to another status (drag & drop on the board). Optimistic, with refetch on failure.
  const handleMoveTask = useCallback((taskId: number, toStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === toStatus) return;

    setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, status: toStatus } : t));

    patchTask(task, { status: toStatus }).catch((error) => {
      console.warn("Failed to update task status", error instanceof Error ? error.message : String(error));
      fetchData(); // revert to server truth
    });
  }, [tasks, fetchData]);

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
              <button className="btn-secondary share-btn" style={{display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px'}}><Share2 size={14} /> Share</button>
            </div>
          </div>
          
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
            onTaskCreated={fetchData}
          />
        )}

        {activeView === 'board' && (
          <BoardView
            tasks={tasks}
            onMoveTask={handleMoveTask}
            onAddTask={() => setIsAddingTask(true)}
          />
        )}

        {activeView === 'calendar' && (
          <CalendarView tasks={tasks} />
        )}
      </div>

      {isAddingTask && (
          <CreateTaskModal
            onClose={() => setIsAddingTask(false)}
            projects={[project]}
            defaultProjectId={project.id}
            onTaskCreated={fetchData}
          />
      )}
    </div>
  );
};
