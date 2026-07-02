import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, MoreHorizontal } from 'lucide-react';
import { Project } from '@/features/projects/types';
import { SpaceListSection } from './SpaceListSection';
import { List } from '@/features/lists/types';
import { TaskItem } from '@/features/tasks/types';

interface SpaceProjectSectionProps {
  project: Project;
  lists: List[];
  tasksByListId: Record<number, TaskItem[]>;
}

// Helper to determine list color based on name like ClickUp
const getListColor = (listName: string) => {
  const upper = listName.toUpperCase();
  if (upper.includes('TODO') || upper.includes('TO DO')) return '#87909e';
  if (upper.includes('IN PROGRESS') || upper.includes('DOING')) return '#2684ff';
  if (upper.includes('DONE') || upper.includes('CLOSED') || upper.includes('COMPLETE')) return '#00c875';
  return '#e2445c'; // Default colorful
};

export const SpaceProjectSection: React.FC<SpaceProjectSectionProps> = ({ project, lists, tasksByListId }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-project-section">
      <div 
        className="project-section-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="chevron-icon">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <Folder size={16} className="project-icon" />
        <span className="project-title">{project.name}</span>
        <button className="icon-btn project-actions" onClick={(e) => { e.stopPropagation(); }}>
          <MoreHorizontal size={14} />
        </button>
      </div>
      
      {isExpanded && (
        <div className="project-lists-container">
          {lists.length > 0 ? (
            lists.map(list => (
              <SpaceListSection 
                key={list.id} 
                list={list} 
                tasks={tasksByListId[list.id] || []} 
                color={getListColor(list.name)}
              />
            ))
          ) : (
            <div className="empty-project">
              No lists in this project.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
