import React, { useState } from 'react';
import { SpaceProjectSection } from './SpaceProjectSection';
import { Project } from '@/features/projects/types';
import { TaskItem } from '@/features/tasks/types';
import { Filter, CheckCircle2, User, SlidersHorizontal, Plus } from 'lucide-react';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { SelectionBar } from '@/features/tasks/components/SelectionBar';

interface SpaceListViewProps {
  projects: Project[];
  tasksByProjectId: Record<number, TaskItem[]>;
}

export const SpaceListView: React.FC<SpaceListViewProps> = ({ projects, tasksByProjectId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-list-view">
      <div className="space-action-bar">
        <div className="action-bar-left">
          <button className="btn-secondary group-btn">
            <span className="group-icon">≡</span> Group: Status
          </button>
          <button className="btn-secondary subtasks-btn">
            ⚯ Subtasks
          </button>
        </div>
        <div className="action-bar-right">
          <button className="icon-text-btn"><Filter size={14} /> Filter</button>
          <button className="icon-text-btn"><CheckCircle2 size={14} /> Closed</button>
          <button className="icon-text-btn"><User size={14} /> Assignee</button>
          <button className="icon-text-btn"><SlidersHorizontal size={14} /> Customize</button>
          <button className="btn-primary add-task-btn" onClick={() => setIsModalOpen(true)}>Add Task <ChevronDownIcon /></button>
        </div>
      </div>
      

      
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
            No projects in this space. Create a project to get started.
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
