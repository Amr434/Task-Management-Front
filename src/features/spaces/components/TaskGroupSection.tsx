import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { TaskItem } from '@/features/tasks/types';
import { TaskRow } from '@/features/tasks/components/TaskRow';
import { useColumnGridTemplate } from '@/features/tasks/hooks/useColumnGridTemplate';
import { useSpaceStore } from '@/store/useSpaceStore';
import { useI18n } from '@/contexts/I18nContext';

interface TaskGroupSectionProps {
  label: string;
  color: string;
  outline?: boolean;
  tasks: TaskItem[];
  childrenByParent: Record<number, TaskItem[]>;
  onOpenModal?: () => void;
}

export const TaskGroupSection: React.FC<TaskGroupSectionProps> = ({ label, color, outline, tasks, childrenByParent, onOpenModal }) => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(true);
  const visibleColumns = useSpaceStore((s) => s.visibleColumns);
  const gridTemplateColumns = useColumnGridTemplate();

  return (
    <div className="space-list-section">
      <div className="list-section-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="chevron-icon" style={{ marginRight: '8px', color: '#87909e' }}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>

        <div className={`list-badge ${outline ? 'outline' : ''}`} style={{ backgroundColor: color }}>
          <span className="list-badge-icon"></span>
          {t.groupLabels[label] ?? label}
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
            tasks.map((task) => (
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
