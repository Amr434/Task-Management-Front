"use client";

import React, { useEffect, useState } from 'react';
import { getProjectById } from '@/features/projects/api/getProjects';
import { getListsByProject } from '@/features/lists/api/getLists';
import { getTasksByList } from '@/features/tasks/api/getTasks';
import { Project } from '@/features/projects/types';
import { List } from '@/features/lists/types';
import { TaskItem } from '@/features/tasks/types';
import { SpaceListView } from '@/features/spaces/components/SpaceListView';
import { LayoutGrid, List as ListIcon, Columns, Calendar, Plus, MoreHorizontal, Share2 } from 'lucide-react';

export const ProjectBoard = ({ projectId }: { projectId: number }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [tasksByList, setTasksByList] = useState<Record<number, TaskItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch project details
        const fetchedProject = await getProjectById(projectId);
        setProject(fetchedProject);

        // Fetch all lists for this project
        const fetchedLists = await getListsByProject(projectId);
        setLists(fetchedLists);

        // Fetch tasks for all lists concurrently
        const tasksData: Record<number, TaskItem[]> = {};
        await Promise.all(
          fetchedLists.map(async (list) => {
            const tasks = await getTasksByList(list.id);
            tasksData[list.id] = tasks;
          })
        );
        setTasksByList(tasksData);
      } catch (error) {
        console.warn("Failed to load project board", error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

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
            <button className="space-tab active">
              <ListIcon size={14} />
              List
            </button>
            <button className="space-tab">
              <Columns size={14} />
              Board
            </button>
            <button className="space-tab">
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

        {/* Reuse the SpaceListView but pass only this project */}
        <SpaceListView 
          projects={[project]} 
          listsByProjectId={{ [project.id]: lists }} 
          tasksByListId={tasksByList} 
        />
      </div>
    </div>
  );
};
