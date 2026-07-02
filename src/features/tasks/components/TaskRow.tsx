import React from 'react';
import { User, Calendar, Flag, CheckCircle2, Circle } from 'lucide-react';
import { TaskItem } from '../types';

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
          <Circle size={16} className="status-icon-pending" />
        </button>
        <span className="task-title">{task.title}</span>
      </div>
      
      <div className="task-cell task-assignee-cell">
        <div className="empty-avatar">
          <User size={14} />
        </div>
      </div>
      
      <div className="task-cell task-date-cell">
        {task.dueDate ? (
          <span className="due-date">{new Date(task.dueDate).toLocaleDateString()}</span>
        ) : (
          <div className="empty-date">
            <Calendar size={14} />
          </div>
        )}
      </div>
      
      <div className="task-cell task-priority-cell">
        <div className={`priority-flag priority-${task.priority}`}>
          <Flag size={14} />
        </div>
      </div>
      
      <div className="task-cell task-add-cell">
        <div className="add-subtask-btn" title="Add subtask">
          +
        </div>
      </div>
    </div>
  );
};
