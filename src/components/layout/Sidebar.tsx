"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Folder, Hash, Briefcase, Plus } from 'lucide-react';
import { getWorkspaces } from '@/features/workspaces/api/getWorkspaces';
import { getProjectsByWorkspace } from '@/features/projects/api/getProjects';
import { getListsByProject } from '@/features/lists/api/getLists';
import { Workspace } from '@/features/workspaces/types';
import { Project } from '@/features/projects/types';
import { List } from '@/features/lists/types';

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({});
  const [listsByProject, setListsByProject] = useState<Record<number, List[]>>({});

  useEffect(() => {
    // Initial fetch of workspaces
    getWorkspaces().then(data => {
      setWorkspaces(data);
      if (data.length > 0) {
        setSelectedWorkspace(data[0]); // Auto-select first workspace
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    // Fetch projects when a workspace is selected
    if (selectedWorkspace) {
      getProjectsByWorkspace(selectedWorkspace.id).then(data => {
        setProjects(data);
      }).catch(console.error);
    }
  }, [selectedWorkspace]);

  const toggleProject = async (projectId: number) => {
    const isExpanded = expandedProjects[projectId];
    
    // Toggle state locally
    setExpandedProjects(prev => ({ ...prev, [projectId]: !isExpanded }));

    // If we are expanding and haven't fetched lists yet, fetch them
    if (!isExpanded && !listsByProject[projectId]) {
      try {
        const lists = await getListsByProject(projectId);
        setListsByProject(prev => ({ ...prev, [projectId]: lists }));
      } catch (err) {
        console.error("Failed to fetch lists", err);
      }
    }
  };

  const handleProjectClick = (projectId: number) => {
    toggleProject(projectId);
    router.push(`/projects/${projectId}`);
  };

  const handleListClick = (listId: number) => {
    router.push(`/lists/${listId}`);
  };

  return (
    <aside className="sidebar">
      {/* Workspace Switcher */}
      <div className="workspace-switcher">
        <div className="workspace-icon">
          {selectedWorkspace?.name.charAt(0).toUpperCase() || 'W'}
        </div>
        <span className="workspace-name">{selectedWorkspace?.name || 'Select Workspace'}</span>
        <ChevronDown size={16} className="ml-auto" />
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="section-title">Favorites</span>
          <div className="nav-item" onClick={() => router.push('/')}>
            <Hash size={16} /> Everything
          </div>
        </div>

        <div className="nav-section">
          <div className="section-header">
            <span className="section-title">Spaces</span>
            <button className="add-btn"><Plus size={14}/></button>
          </div>
          
          <div className="projects-container">
            {projects.map(project => {
              const isExpanded = expandedProjects[project.id];
              const projectLists = listsByProject[project.id] || [];
              const isProjectActive = pathname === `/projects/${project.id}`;

              return (
                <div key={project.id} className="project-group">
                  <div 
                    className={`nav-item project-item ${isProjectActive ? 'active' : ''}`} 
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <span className="chevron-icon" onClick={(e) => {
                      e.stopPropagation(); // prevent navigation if only clicking chevron
                      toggleProject(project.id);
                    }}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <Briefcase size={16} className={isProjectActive ? "text-primary" : "text-accent"} />
                    <span>{project.name}</span>
                  </div>

                  {/* Nested Lists */}
                  {isExpanded && (
                    <div className="lists-container">
                      {projectLists.length === 0 ? (
                        <div className="empty-lists">No lists</div>
                      ) : (
                        projectLists.map(list => {
                          const isListActive = pathname === `/lists/${list.id}`;
                          return (
                            <div 
                              key={list.id} 
                              className={`nav-item list-item ${isListActive ? 'active' : ''}`}
                              onClick={() => handleListClick(list.id)}
                            >
                              <Folder size={14} className={isListActive ? "text-accent" : ""} />
                              <span style={{ fontWeight: isListActive ? 600 : 400 }}>{list.name}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
};
