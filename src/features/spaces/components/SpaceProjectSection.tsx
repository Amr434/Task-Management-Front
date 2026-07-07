import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Project } from '@/features/projects/types';
import { TaskGroupSection } from './TaskGroupSection';
import { TaskItem } from '@/features/tasks/types';
import { buildGroups } from '@/features/tasks/grouping';
import { useSpaceStore } from '@/store/useSpaceStore';

interface SpaceProjectSectionProps {
  project: Project;
  tasks: TaskItem[];
  onOpenModal?: () => void;
}

export const SpaceProjectSection: React.FC<SpaceProjectSectionProps> = ({ project, tasks, onOpenModal }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const groupBy = useSpaceStore((s) => s.groupBy);
  const groupDir = useSpaceStore((s) => s.groupDir);

  // Build the subtask tree: map each parent id to its direct children, and keep
  // only top-level tasks (no parent) for the groups — subtasks render nested
  // under their parent inside TaskRow.
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

  const groups = useMemo(
    () => buildGroups(topLevelTasks, groupBy, groupDir),
    [topLevelTasks, groupBy, groupDir]
  );

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
          {groups.map((group) => (
            <TaskGroupSection
              key={group.key}
              label={group.label}
              color={group.color}
              outline={group.outline}
              tasks={group.tasks}
              childrenByParent={childrenByParent}
              onOpenModal={onOpenModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};
