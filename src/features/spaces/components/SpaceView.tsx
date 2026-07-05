"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { SpaceHeader } from './SpaceHeader';
import { SpaceListView } from './SpaceListView';
import { Space } from '../types';
import { Project } from '@/features/projects/types';
import { TaskItem } from '@/features/tasks/types';
import { getTasksByProject } from '@/features/tasks/api';
import apiClient from '@/services/apiClient';

interface SpaceViewProps {
  spaceId: number;
}

export const SpaceView: React.FC<SpaceViewProps> = ({ spaceId }) => {
  const [space, setSpace] = useState<Space | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasksByProjectId, setTasksByProjectId] = useState<Record<number, TaskItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchSpaceData = useCallback(async () => {
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

        // 3. For each project, fetch its tasks
        const tasksMap: Record<number, TaskItem[]> = {};

        for (const project of fetchedProjects) {
          tasksMap[project.id] = await getTasksByProject(project.id);
        }

        setTasksByProjectId(tasksMap);
      } catch (error) {
        console.error("Failed to load space data", error);
      } finally {
        setIsLoading(false);
      }
  }, [spaceId]);

  useEffect(() => {
    fetchSpaceData();
  }, [fetchSpaceData]);

  if (isLoading) {
    return <div className="space-loading">Loading Space...</div>;
  }

  return (
    <div className="space-view-container">
      <SpaceHeader space={space} />
      <SpaceListView
        projects={projects}
        tasksByProjectId={tasksByProjectId}
        onTaskCreated={fetchSpaceData}
      />
    </div>
  );
};
