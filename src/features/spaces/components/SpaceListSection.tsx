import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { List } from '@/features/lists/types';
import { TaskItem } from '@/features/tasks/types';
import { TaskRow } from '@/features/tasks/components/TaskRow';

interface SpaceListSectionProps {
  list: List;
  tasks: TaskItem[];
  color?: string; // We can pass a color based on status, e.g. Grey for TODO, Blue for In Progress
  onOpenModal?: () => void;
}

export const SpaceListSection: React.FC<SpaceListSectionProps> = ({ list, tasks, color = '#87909e', onOpenModal }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-list-section">
      <div 
        className="list-section-header" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="chevron-icon" style={{marginRight: '8px', color: '#87909e'}}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        
        <div className={`list-badge ${list.name.toLowerCase().includes('to do') ? 'outline' : ''}`} style={{ backgroundColor: color }}>
          <span className="list-badge-icon"></span>
          {list.name.toUpperCase()}
        </div>
        
        <span className="task-count">{tasks.length}</span>
        
        <div className="list-header-actions">
          <button className="icon-btn add-task-icon" onClick={(e) => { e.stopPropagation(); onOpenModal?.(); }}>
            <Plus size={14} />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="list-tasks-container">
          <div className="table-header">
            <div className="th-cell th-name">Name</div>
            <div className="th-cell th-assignee">Assignee</div>
            <div className="th-cell th-due">Due date</div>
            <div className="th-cell th-priority">Priority</div>
          </div>
          
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskRow key={task.id} task={task} />
            ))
          ) : (
            <div className="empty-tasks-row">
              <span className="empty-text">No tasks in this list</span>
            </div>
          )}
          <div className="add-task-row" onClick={() => onOpenModal?.()}>
            <Plus size={14} className="add-icon" />
            <span className="add-text">Add Task</span>
          </div>
        </div>
      )}
    </div>
  );
};
