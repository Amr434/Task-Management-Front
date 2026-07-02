"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Folder, Hash, Briefcase, Plus, Trash2, Users, CheckSquare, Network, MoreHorizontal } from 'lucide-react';
import { getSpaces } from '@/features/spaces/api/getSpaces';
import { getProjectsBySpace } from '@/features/projects/api/getProjects';
import { deleteProject } from '@/features/projects/api/deleteProject';
import { getListsByProject } from '@/features/lists/api/getLists';
import { Space } from '@/features/spaces/types';
import { Project } from '@/features/projects/types';
import { List } from '@/features/lists/types';
import { useI18n } from '@/contexts/I18nContext';
import { CreateSpaceModal } from '@/features/spaces/components/CreateSpaceModal';

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, setLanguage } = useI18n();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [expandedSpaces, setExpandedSpaces] = useState<Record<number, boolean>>({});
  const [projectsBySpace, setProjectsBySpace] = useState<Record<number, Project[]>>({});
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({});
  const [listsByProject, setListsByProject] = useState<Record<number, List[]>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    getSpaces().then(data => {
      setSpaces(data);
    }).catch(err => console.warn("Failed to fetch spaces:", err instanceof Error ? err.message : String(err)));
  }, []);

  const toggleSpace = async (spaceId: number) => {
    const isExpanded = expandedSpaces[spaceId];
    setExpandedSpaces(prev => ({ ...prev, [spaceId]: !isExpanded }));

    if (!isExpanded && !projectsBySpace[spaceId]) {
      try {
        const projects = await getProjectsBySpace(spaceId);
        setProjectsBySpace(prev => ({ ...prev, [spaceId]: projects }));
      } catch (err) {
        console.warn("Failed to fetch projects", err instanceof Error ? err.message : String(err));
      }
    }
  };

  const toggleProject = async (projectId: number) => {
    const isExpanded = expandedProjects[projectId];
    setExpandedProjects(prev => ({ ...prev, [projectId]: !isExpanded }));

    if (!isExpanded && !listsByProject[projectId]) {
      try {
        const lists = await getListsByProject(projectId);
        setListsByProject(prev => ({ ...prev, [projectId]: lists }));
      } catch (err) {
        console.warn("Failed to fetch lists", err instanceof Error ? err.message : String(err));
      }
    }
  };

  const handleSpaceClick = (spaceId: number) => {
    toggleSpace(spaceId);
    router.push(`/spaces/${spaceId}`);
  };

  const handleProjectClick = (projectId: number) => {
    toggleProject(projectId);
    router.push(`/projects/${projectId}`);
  };

  const handleListClick = (listId: number) => {
    router.push(`/lists/${listId}`);
  };

  const handleCreateSpace = (newSpace: Space) => {
    setSpaces(prev => [...prev, newSpace]);
    setIsModalOpen(false);
  };

  const handleDeleteSpace = async (spaceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Assuming you have a deleteSpace API
    // await deleteSpace(spaceId);
    // setSpaces(prev => prev.filter(s => s.id !== spaceId));
  };

  return (
    <aside className="sidebar">
      {/* Top section instead of Workspace switcher */}
      <div className="workspace-switcher">
        <div className="workspace-icon">
          {spaces.length > 0 ? spaces[0].name.charAt(0).toUpperCase() : 'M'}
        </div>
        <span className="workspace-name">{spaces.length > 0 ? t.spaces : 'My Spaces'}</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="section-title">{t.favorites}</span>
          <div className="nav-item" onClick={() => router.push('/')}>
            <Network size={16} style={{ transform: 'rotate(90deg)' }} /> <span className="item-name">{t.everything || 'All Tasks'}</span>
          </div>
        </div>

        <div className="nav-section">
          <div className="section-header">
            <span className="section-title">{t.spaces}</span>
            <button className="add-btn" onClick={() => setIsModalOpen(true)} title={t.createSpace}><Plus size={14} /></button>
          </div>

          <div className="projects-container">
            {spaces.map(space => {
              const isSpaceExpanded = expandedSpaces[space.id];
              const spaceProjects = projectsBySpace[space.id] || [];

              return (
                <div key={space.id} className="project-group">
                  <div
                    className={`nav-item project-item`}
                    onClick={() => handleSpaceClick(space.id)}
                  >
                    <span className="chevron-icon" onClick={(e) => {
                      e.stopPropagation();
                      toggleSpace(space.id);
                    }}>
                      {isSpaceExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <div className="space-icon-wrapper" style={{ backgroundColor: space.color || 'var(--accent-color)' }}>
                      <Users size={14} color="white" />
                    </div>
                    <span className="item-name space-name">{space.name}</span>
                    <div className="space-actions">
                      <button className="action-btn" onClick={(e) => handleDeleteSpace(space.id, e)} title={t.deleteSpace}>
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Nested Projects */}
                  {isSpaceExpanded && (
                    <div className="lists-container" style={{ paddingLeft: '8px' }}>
                      {spaceProjects.length === 0 ? (
                        <div className="empty-lists" style={{ paddingLeft: '16px' }}>No projects</div>
                      ) : (
                        spaceProjects.map(project => {
                          const isProjectExpanded = expandedProjects[project.id];
                          const projectLists = listsByProject[project.id] || [];
                          const isProjectActive = pathname === `/projects/${project.id}`;

                          return (
                            <div key={project.id} className="project-group">
                              <div
                                className={`nav-item project-item ${isProjectActive ? 'active' : ''}`}
                                onClick={() => handleProjectClick(project.id)}
                              >
                                <span className="chevron-icon" onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProject(project.id);
                                }}>
                                  {isProjectExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </span>
                                <CheckSquare size={14} className={isProjectActive ? "text-primary" : ""} />
                                <span className="item-name project-name">{project.name}</span>
                                <span className="item-badge">{projectLists.length || 0}</span>
                              </div>

                              {/* Nested Lists */}
                              {isProjectExpanded && (
                                <div className="lists-container" style={{ paddingLeft: '16px' }}>
                                  {projectLists.length === 0 ? (
                                    <div className="empty-lists" style={{ paddingLeft: '16px' }}>{t.noLists}</div>
                                  ) : (
                                    projectLists.map(list => {
                                      const isListActive = pathname === `/lists/${list.id}`;
                                      return (
                                        <div
                                          key={list.id}
                                          className={`nav-item list-item ${isListActive ? 'active' : ''}`}
                                          onClick={() => handleListClick(list.id)}
                                        >
                                          <Hash size={14} className={isListActive ? "text-accent" : ""} />
                                          <span style={{ fontWeight: isListActive ? 600 : 400 }}>{list.name}</span>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
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
          <div className="nav-item new-space-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="text-secondary" style={{ marginRight: '8px' }} />
            <span>New Space</span>
          </div>
        </div>
      </nav>

      {/* Language Toggle */}
      <div className="language-toggle">
        <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
        <button className={language === 'ar' ? 'active' : ''} onClick={() => setLanguage('ar')}>عربي</button>
      </div>

      {isModalOpen && (
        <CreateSpaceModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateSpace as any}
        />
      )}
    </aside>
  );
};
