"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Plus, CheckSquare, Network, MoreHorizontal } from 'lucide-react';
import { getSpaces, deleteSpace } from '@/features/spaces/api';
import { getProjectsBySpace } from '@/features/projects/api';
import { Space } from '@/features/spaces/types';
import { Project } from '@/features/projects/types';
import { useI18n } from '@/contexts/I18nContext';
import { CreateSpaceModal } from '@/features/spaces/components/CreateSpaceModal';
import { SpaceIcon } from '@/features/spaces/components/SpaceIcon';
import { CreateProjectModal } from '@/features/projects/components/CreateProjectModal';

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, setLanguage } = useI18n();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [expandedSpaces, setExpandedSpaces] = useState<Record<number, boolean>>({});
  const [projectsBySpace, setProjectsBySpace] = useState<Record<number, Project[]>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectModalSpace, setProjectModalSpace] = useState<{ id: number; name: string } | null>(null);

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

  const handleSpaceClick = (spaceId: number) => {
    toggleSpace(spaceId);
    router.push(`/spaces/${spaceId}`);
  };

  const handleProjectClick = (projectId: number, spaceId: number) => {
    router.push(`/projects/${projectId}?spaceId=${spaceId}`);
  };

  const handleCreateSpace = (newSpace: Space) => {
    setSpaces(prev => [...prev, newSpace]);
    setIsModalOpen(false);
  };

  const openCreateProject = (space: Space, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectModalSpace({ id: space.id, name: space.name });
  };

  const handleCreateProject = (newProject: Project) => {
    const spaceId = newProject.spaceId;
    setProjectsBySpace(prev => ({
      ...prev,
      [spaceId]: [...(prev[spaceId] || []), newProject],
    }));
    setExpandedSpaces(prev => ({ ...prev, [spaceId]: true }));
    setProjectModalSpace(null);
    router.push(`/projects/${newProject.id}?spaceId=${spaceId}`);
  };

  const handleDeleteSpace = async (spaceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t.confirmDeleteSpace)) return;
    try {
      await deleteSpace(spaceId);
      setSpaces(prev => prev.filter(s => s.id !== spaceId));
      if (pathname === `/spaces/${spaceId}`) {
        router.push('/');
      }
    } catch (err) {
      console.warn("Failed to delete space", err instanceof Error ? err.message : String(err));
      alert("Failed to delete space");
    }
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
                    <SpaceIcon icon={space.icon} color={space.color} size={22} className="space-nav-icon" />
                    <span className="item-name space-name">{space.name}</span>
                    <div className="space-actions">
                      <button className="action-btn" onClick={(e) => openCreateProject(space, e)} title="Add project">
                        <Plus size={15} />
                      </button>
                      <button className="action-btn" onClick={(e) => handleDeleteSpace(space.id, e)} title={t.deleteSpace}>
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Nested Projects */}
                  {isSpaceExpanded && (
                    <div className="lists-container" style={{ paddingLeft: '8px' }}>
                      {spaceProjects.length === 0 ? (
                        <div className="nav-item add-project-row" onClick={(e) => openCreateProject(space, e)}>
                          <Plus size={14} /> <span>Add project</span>
                        </div>
                      ) : (
                        spaceProjects.map(project => {
                          const isProjectActive = pathname === `/projects/${project.id}`;

                          return (
                            <div key={project.id} className="project-group">
                              <div
                                className={`nav-item project-item ${isProjectActive ? 'active' : ''}`}
                                onClick={() => handleProjectClick(project.id, space.id)}
                              >
                                <CheckSquare size={14} className={isProjectActive ? "text-primary" : ""} />
                                <span className="item-name project-name">{project.name}</span>
                              </div>
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
          onSuccess={handleCreateSpace}
        />
      )}

      {projectModalSpace && (
        <CreateProjectModal
          spaceId={projectModalSpace.id}
          spaceName={projectModalSpace.name}
          onClose={() => setProjectModalSpace(null)}
          onSuccess={handleCreateProject}
        />
      )}
    </aside>
  );
};
