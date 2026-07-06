import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Folder, MoreHorizontal } from 'lucide-react';
import { Project } from '@/features/projects/types';
import { SpaceStatusSection } from './SpaceStatusSection';
import { TaskItem, TaskStatus } from '@/features/tasks/types';

interface SpaceProjectSectionProps {
  project: Project;
  tasks: TaskItem[];
  onOpenModal?: () => void;
  onChanged?: () => void;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.ToDo: return '#87909e';
    case TaskStatus.InProgress: return '#2684ff';
    case TaskStatus.Complete: return '#00c875';
    default: return '#e2445c'; // Default colorful
  }
};

export const SpaceProjectSection: React.FC<SpaceProjectSectionProps> = ({ project, tasks, onOpenModal, onChanged }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Build the subtask tree: map each parent id to its direct children, and keep
  // only top-level tasks (no parent) for the status columns — subtasks render
  // nested under their parent inside TaskRow.
  const { childrenByParent, topLevelTasks } = useMemo(() => {
    const map: Record<number, TaskItem[]> = {};
    const top: TaskItem[] = [];
    for (const t of tasks) {
      if (t.parentTaskId != null) {
        (map[t.parentTaskId] ??= []).push(t);
      } else {
        top.push(t);
      }
    }
    return { childrenByParent: map, topLevelTasks: top };
  }, [tasks]);

  return (
    <div className="space-project-section">
      <div className="team-space-title">Team Space</div>
      <div 
        className="project-section-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="chevron-icon" style={{marginRight: '8px'}}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="project-title">{project.name}</span>
        <button className="icon-btn project-actions" onClick={(e) => { e.stopPropagation(); }}>
          <MoreHorizontal size={14} />
        </button>
      </div>
      
      {isExpanded && (
        <div className="project-lists-container">
          {[TaskStatus.ToDo, TaskStatus.InProgress, TaskStatus.Complete].map(status => {
            const statusTasks = topLevelTasks.filter(t => t.status === status);
            return (
              <SpaceStatusSection
                key={status}
                status={status}
                tasks={statusTasks}
                childrenByParent={childrenByParent}
                color={getStatusColor(status)}
                onOpenModal={onOpenModal}
                onChanged={onChanged}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
