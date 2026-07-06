"use client";

import React, { useEffect } from 'react';
import { SpaceHeader } from './SpaceHeader';
import { SpaceListView } from './SpaceListView';
import { useSpaceStore } from '@/store/useSpaceStore';

interface SpaceViewProps {
  spaceId: number;
}

export const SpaceView: React.FC<SpaceViewProps> = ({ spaceId }) => {
  const { space, projects, tasksByProjectId, isLoading, fetchSpaceData } = useSpaceStore();

  useEffect(() => {
    fetchSpaceData(spaceId);
  }, [spaceId, fetchSpaceData]);

  if (isLoading) {
    return <div className="space-loading">Loading Space...</div>;
  }

  return (
    <div className="space-view-container">
      <SpaceHeader space={space} />
      <SpaceListView
        projects={projects}
        tasksByProjectId={tasksByProjectId}
      />
    </div>
  );
};
