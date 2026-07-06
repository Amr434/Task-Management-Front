import React, { useState, useEffect } from 'react';
import { X, LayoutGrid, CheckCircle2, ChevronDown, User, Calendar, Flag, Tag, MoreHorizontal, Plus, Paperclip, Bell } from 'lucide-react';
import { Project } from '@/features/projects/types';
import { createTask } from '../api';
import { Priority } from '../types';
import { useSpaceStore } from '@/store/useSpaceStore';

interface CreateTaskModalProps {
  onClose: () => void;
  projects?: Project[];
  defaultProjectId?: number;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ 
  onClose, 
  projects = [], 
  defaultProjectId,
}) => {
  const { addTaskLocally } = useSpaceStore();
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(defaultProjectId || (projects.length > 0 ? projects[0].id : null));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateTask = async () => {
    if (!taskName.trim()) {
      alert("Task name is required");
      return;
    }
    if (!selectedProjectId) {
      alert("Please select a valid project to add the task to.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newTask = await createTask({
        title: taskName,
        description,
        projectId: selectedProjectId,
        status: 0, // 0 = TO DO by default
        priority: Priority.Low,
        order: 0, // Let backend assign order
      });
      
      addTaskLocally(newTask);
      onClose();
    } catch (error) {
      console.error("Failed to create task", error);
      alert("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    setIsProjectDropdownOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="modal-backdrop task-modal-backdrop" onClick={onClose}>
      <div className="task-modal-content" onClick={e => e.stopPropagation()}>
        {/* Modal Header Tabs */}
        <div className="task-modal-header">
          <div className="task-modal-tabs">
            <button className="task-tab active">Task</button>
            <button className="task-tab">Doc</button>
            <button className="task-tab">Reminder</button>
            <button className="task-tab">Whiteboard</button>
            <button className="task-tab">Dashboard</button>
          </div>
          <div className="task-modal-header-actions">
            <button className="icon-btn" title="Minimize">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6"/><path d="M10 14 3 21"/></svg>
            </button>
            <button className="icon-btn" onClick={onClose} title="Close"><X size={16} /></button>
          </div>
        </div>

        {/* Path / Location Selectors */}
        <div className="task-location-selectors">
          <div style={{ position: 'relative' }}>
            <button 
              className="location-btn project-selector"
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            >
              <LayoutGrid size={14} className="text-secondary" /> 
              <span>{selectedProject ? selectedProject.name : 'Select Project'}</span>
              <ChevronDown size={14} className="text-secondary" />
            </button>
            
            {isProjectDropdownOpen && (
              <div className="custom-dropdown-menu">
                <div className="dropdown-search-wrapper">
                  <svg className="dropdown-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <input 
                    type="text" 
                    className="dropdown-search-input" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="dropdown-generic-item">
                  <User size={16} className="generic-icon" />
                  <span>Personal List</span>
                </div>
                
                <div className="dropdown-section">
                  <div className="dropdown-section-title">Recents</div>
                  {filteredProjects.map(project => (
                    <div 
                      key={`recent-${project.id}`} 
                      className={`dropdown-item ${selectedProjectId === project.id ? 'selected' : ''}`}
                      onClick={() => handleSelectProject(project.id)}
                    >
                      <LayoutGrid size={14} className="item-icon" />
                      <span className="item-name">{project.name}</span>
                      {selectedProjectId === project.id ? (
                        <svg className="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <span className="item-count">3</span>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="dropdown-section">
                  <div className="dropdown-section-title">Spaces</div>
                  <div className="dropdown-space-header">
                    <div className="space-header-icon" style={{background: '#3e82f7'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <span>Team Space</span>
                  </div>
                  {filteredProjects.map(project => (
                    <div 
                      key={`space-${project.id}`} 
                      className={`dropdown-item space-indented ${selectedProjectId === project.id ? 'selected' : ''}`}
                      onClick={() => handleSelectProject(project.id)}
                    >
                      <LayoutGrid size={14} className="item-icon" />
                      <span className="item-name">{project.name}</span>
                      {selectedProjectId === project.id ? (
                        <svg className="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <span className="item-count">3</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button className="location-btn type-selector">
            <CheckCircle2 size={14} className="text-secondary" /> 
            <span>Task</span>
            <ChevronDown size={14} className="text-secondary" />
          </button>
        </div>

        {/* Task Name Input */}
        <div className="task-name-input-wrapper">
          <input 
            type="text" 
            className="task-name-input" 
            placeholder="Task Name" 
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Task Description Input */}
        <div className="task-desc-input-wrapper">
          <textarea 
            className="task-desc-input" 
            placeholder="Add description, or write with ✨ AI" 
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Action Toolbar */}
        <div className="task-action-toolbar">
          <button className="toolbar-btn status-btn">
            <span className="status-dot"></span>
            TO DO
          </button>
          <button className="toolbar-btn">
            <User size={14} className="text-secondary" /> Assignee
          </button>
          <button className="toolbar-btn">
            <Calendar size={14} className="text-secondary" /> Due date
          </button>
          <button className="toolbar-btn">
            <Flag size={14} className="text-secondary" /> Priority
          </button>
          <button className="toolbar-btn">
            <Tag size={14} className="text-secondary" /> Tags
          </button>
          <button className="toolbar-btn icon-only">
            <MoreHorizontal size={14} className="text-secondary" />
          </button>
        </div>

        {/* Fields Section */}
        <div className="task-fields-section">
          <h4 className="fields-title">Fields</h4>
          <button className="create-field-btn">
            <Plus size={14} /> Create new field
          </button>
        </div>

        {/* Bottom Bar */}
        <div className="task-modal-footer">
          <div className="footer-left">
            <button className="templates-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><path d="m14.5 2.5 7 7"/><path d="m21.5 9.5-12 12"/><path d="M2.5 14.5l7 7"/><path d="m2.5 21.5 12-12"/></svg>
              Templates
            </button>
          </div>
          <div className="footer-right">
            <button className="icon-btn attachment-btn" title="Add attachment">
              <Paperclip size={16} />
            </button>
            <button className="icon-btn followers-btn" title="Followers">
              <Bell size={16} /> <span className="follower-count">1</span>
            </button>
            <div className="create-task-btn-group">
              <button 
                className="btn-primary create-btn-main"
                onClick={handleCreateTask}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
              <button className="btn-primary create-btn-dropdown" disabled={isSubmitting}>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
