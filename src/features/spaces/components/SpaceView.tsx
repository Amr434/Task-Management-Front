"use client";

import React, { useEffect, useState } from 'react';
import { SpaceHeader } from './SpaceHeader';
import { SpaceListView } from './SpaceListView';
import { Space } from '../types';
import { Project } from '@/features/projects/types';
import { List } from '@/features/lists/types';
import { TaskItem } from '@/features/tasks/types';
import apiClient from '@/services/apiClient';

interface SpaceViewProps {
  spaceId: number;
}

export const SpaceView: React.FC<SpaceViewProps> = ({ spaceId }) => {
  const [space, setSpace] = useState<Space | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [listsByProjectId, setListsByProjectId] = useState<Record<number, List[]>>({});
  const [tasksByListId, setTasksByListId] = useState<Record<number, TaskItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSpaceData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch space details - assuming we have or can fake a get space endpoint
        // Since there might not be a GET /Spaces/:id, we can fetch all and find it
        const spaces = await apiClient.get<any, Space[]>('/Spaces');
        const foundSpace = spaces.find(s => s.id === spaceId);
        if (foundSpace) {
          setSpace(foundSpace);
        }

        // 2. Fetch projects in space
        const fetchedProjects = await apiClient.get<any, Project[]>(`/Projects/space/${spaceId}`);
        setProjects(fetchedProjects);

        // 3. For each project, fetch its lists
        const listsMap: Record<number, List[]> = {};
        const tasksMap: Record<number, TaskItem[]> = {};

        for (const project of fetchedProjects) {
          const projectLists = await apiClient.get<any, List[]>(`/Lists/project/${project.id}`);
          listsMap[project.id] = projectLists;

          // 4. For each list, fetch its tasks
          for (const list of projectLists) {
            const listTasks = await apiClient.get<any, TaskItem[]>(`/Tasks/list/${list.id}`);
            tasksMap[list.id] = listTasks;
          }
        }

        setListsByProjectId(listsMap);
        setTasksByListId(tasksMap);
      } catch (error) {
        console.error("Failed to load space data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpaceData();
  }, [spaceId]);

  if (isLoading) {
    return <div className="space-loading">Loading Space...</div>;
  }

  return (
    <div className="space-view-container">
      <SpaceHeader space={space} />
      <SpaceListView 
        projects={projects} 
        listsByProjectId={listsByProjectId} 
        tasksByListId={tasksByListId} 
      />
    </div>
  );
};
