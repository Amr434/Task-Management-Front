import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { TaskItem, TaskStatus } from '@/features/tasks/types';
import { TaskRow } from '@/features/tasks/components/TaskRow';
import { useColumnGridTemplate } from '@/features/tasks/hooks/useColumnGridTemplate';
import { useSpaceStore } from '@/store/useSpaceStore';
import { useI18n } from '@/contexts/I18nContext';

interface SpaceStatusSectionProps {
  status: TaskStatus;
  tasks: TaskItem[];
  childrenByParent: Record<number, TaskItem[]>;
  color?: string; // We can pass a color based on status, e.g. Grey for TODO, Blue for In Progress
  onOpenModal?: () => void;
}

const getStatusName = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.ToDo: return 'TO DO';
    case TaskStatus.InProgress: return 'IN PROGRESS';
    case TaskStatus.Complete: return 'COMPLETE';
    default: return 'UNKNOWN';
  }
};

export const SpaceStatusSection: React.FC<SpaceStatusSectionProps> = ({ status, tasks, childrenByParent, color = '#87909e', onOpenModal }) => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(true);
  const visibleColumns = useSpaceStore((s) => s.visibleColumns);
  const gridTemplateColumns = useColumnGridTemplate();

  return (
    <div className="space-list-section">
      <div 
        className="list-section-header" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="chevron-icon" style={{marginRight: '8px', color: '#87909e'}}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        
        <div className={`list-badge ${status === TaskStatus.ToDo ? 'outline' : ''}`} style={{ backgroundColor: color }}>
          <span className="list-badge-icon"></span>
          {t.groupLabels[getStatusName(status)] ?? getStatusName(status)}
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
          <div className="table-header" style={{ gridTemplateColumns }}>
            <div className="th-cell th-name">{t.colName}</div>
            {visibleColumns.assignee && <div className="th-cell th-assignee">{t.colAssignee}</div>}
            {visibleColumns.dueDate && <div className="th-cell th-due">{t.colDueDate}</div>}
            {visibleColumns.priority && <div className="th-cell th-priority">{t.colPriority}</div>}
          </div>
          
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskRow key={task.id} task={task} childrenByParent={childrenByParent} />
            ))

          ) : (
            <div className="empty-tasks-row">
              <span className="empty-text">{t.noTasks}</span>
            </div>
          )}
          <div className="add-task-row" onClick={() => onOpenModal?.()}>
            <Plus size={14} className="add-icon" />
            <span className="add-text">{t.addTask}</span>
          </div>
        </div>
      )}
    </div>
  );
};
