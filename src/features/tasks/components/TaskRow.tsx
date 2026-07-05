import React from 'react';
import { User, Calendar, Flag, CheckCircle2, Circle } from 'lucide-react';
import { TaskItem, toPriority } from '../types';

interface TaskRowProps {
  task: TaskItem;
  onToggleStatus?: (taskId: number) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({ task, onToggleStatus }) => {
  return (
    <div className="task-row">
      <div className="task-cell task-name-cell">
        <button 
          className="task-status-btn"
          onClick={() => onToggleStatus && onToggleStatus(task.id)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
        </button>
        <span className="task-title">{task.title}</span>
      </div>
      
      <div className="task-cell task-assignee-cell">
        <div className="empty-avatar">
          <User size={14} />
          <span style={{fontSize: '10px', marginTop: '2px'}}>+</span>
        </div>
      </div>
      
      <div className="task-cell task-date-cell">
        {task.dueDate ? (
          <span className="due-date">{new Date(task.dueDate).toLocaleDateString()}</span>
        ) : (
          <div className="empty-date">
            <Calendar size={14} />
            <span style={{fontSize: '10px', marginTop: '2px'}}>+</span>
          </div>
        )}
      </div>
      
      <div className="task-cell task-priority-cell">
        <div className={`priority-flag priority-${toPriority(task.priority)}`}>
          <Flag size={14} />
        </div>
      </div>
    </div>
  );
};
