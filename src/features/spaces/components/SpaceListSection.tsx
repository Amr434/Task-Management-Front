import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { List } from '@/features/lists/types';
import { TaskItem } from '@/features/tasks/types';
import { TaskRow } from '@/features/tasks/components/TaskRow';

interface SpaceListSectionProps {
  list: List;
  tasks: TaskItem[];
  color?: string; // We can pass a color based on status, e.g. Grey for TODO, Blue for In Progress
}

export const SpaceListSection: React.FC<SpaceListSectionProps> = ({ list, tasks, color = '#87909e' }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-list-section">
      <div 
        className="list-section-header" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="chevron-icon">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        
        <div className="list-badge" style={{ backgroundColor: color }}>
          {list.name.toUpperCase()}
        </div>
        
        <span className="task-count">{tasks.length}</span>
        
        <div className="list-header-actions">
          <button className="icon-btn add-task-icon" onClick={(e) => { e.stopPropagation(); /* Add task logic */ }}>
            <Plus size={14} />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="list-tasks-container">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskRow key={task.id} task={task} />
            ))
          ) : (
            <div className="empty-tasks-row">
              <span className="empty-text">No tasks in this list</span>
            </div>
          )}
          <div className="add-task-row">
            <Plus size={14} className="add-icon" />
            <span className="add-text">Add Task</span>
          </div>
        </div>
      )}
    </div>
  );
};
