import React, { useState, useRef, useMemo } from 'react';
import { SpaceProjectSection } from './SpaceProjectSection';
import { Project } from '@/features/projects/types';
import { TaskItem } from '@/features/tasks/types';
import { Filter, CheckCircle2 } from 'lucide-react';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { SelectionBar } from '@/features/tasks/components/SelectionBar';
import { GroupByControl } from '@/features/tasks/components/GroupByControl';
import { FilterPopover } from './FilterPopover';
import { AssigneeFilterControl } from './AssigneeFilterControl';
import { CustomizeColumnsControl } from './CustomizeColumnsControl';

import { useSpaceStore } from '@/store/useSpaceStore';
import { useI18n } from '@/contexts/I18nContext';

interface SpaceListViewProps {
  projects: Project[];
  tasksByProjectId: Record<number, TaskItem[]>;
}

export const SpaceListView: React.FC<SpaceListViewProps> = ({ projects, tasksByProjectId }) => {
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const filterQuery = useSpaceStore((s) => s.filterQuery);
  const showClosed = useSpaceStore((s) => s.showClosed);
  const filterPriority = useSpaceStore((s) => s.filterPriority);
  const filterStatus = useSpaceStore((s) => s.filterStatus);
  const filterTagId = useSpaceStore((s) => s.filterTagId);
  const setShowClosed = useSpaceStore((s) => s.setShowClosed);

  const filterCount = useMemo(() => {
    let count = 0;
    if (filterQuery !== '') count++;
    if (filterPriority !== null) count++;
    if (filterStatus !== null) count++;
    if (filterTagId !== null) count++;
    return count;
  }, [filterQuery, filterPriority, filterStatus, filterTagId]);

  return (
    <div className="space-list-view">
      <div className="space-action-bar">
        <div className="action-bar-left">
          <GroupByControl />
          <button className="btn-secondary subtasks-btn">
            ⚯ {t.subtasksLabel}
          </button>
        </div>
        <div className="action-bar-right">
          <button 
            ref={filterButtonRef}
            className={`icon-text-btn ${showFilterBar || filterCount > 0 ? 'active' : ''}`}
            onClick={() => setShowFilterBar(!showFilterBar)}
          >
            <Filter size={14} /> {t.filter} {filterCount > 0 && <span className="filter-count-badge">{filterCount}</span>}
          </button>
          <button
            className={`icon-text-btn ${showClosed ? 'active' : ''}`}
            onClick={() => setShowClosed(!showClosed)}
            title={showClosed ? t.showAllTasks : t.showOnlyCompleted}
          >
            <CheckCircle2 size={14} /> {t.closed}
          </button>
          <AssigneeFilterControl />
          <CustomizeColumnsControl />
          <button className="btn-primary add-task-btn" onClick={() => setIsModalOpen(true)}>{t.addTask} <ChevronDownIcon /></button>
        </div>
      </div>
      
      {showFilterBar && (
        <FilterPopover
          anchorRef={filterButtonRef}
          onClose={() => setShowFilterBar(false)}
        />
      )}
      

      
      <div className="table-body">
        {projects.length > 0 ? (
          projects.map(project => (
            <SpaceProjectSection
              key={project.id}
              project={project}
              tasks={tasksByProjectId[project.id] || []}
              onOpenModal={() => setIsModalOpen(true)}
            />
          ))
        ) : (
          <div className="empty-state">
            {t.noProjects}
          </div>
        )}
      </div>

      <SelectionBar allTasks={Object.values(tasksByProjectId).flat()} />

      {isModalOpen && (
        <CreateTaskModal
          onClose={() => setIsModalOpen(false)}
          projects={projects}
        />
      )}
    </div>
  );
};

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '4px'}}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
