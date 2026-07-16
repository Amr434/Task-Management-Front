"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Plus, CheckSquare, Network, MoreHorizontal, Pencil, Link2, Copy, Trash2, FolderInput, BarChart3, UserCircle, CalendarClock, User, Inbox, MessageSquareReply, MessageSquare } from 'lucide-react';
import { getSpaces, deleteSpace, duplicateSpace } from '@/features/spaces/api';
import { getProjectsBySpace, deleteProject, duplicateProject, updateProject } from '@/features/projects/api';
import { Space } from '@/features/spaces/types';
import { Project } from '@/features/projects/types';
import { useI18n } from '@/contexts/I18nContext';
import { useInvitationStore } from '@/features/invitations/store/useInvitationStore';
import { CreateSpaceModal } from '@/features/spaces/components/CreateSpaceModal';
import { SpaceIcon } from '@/features/spaces/components/SpaceIcon';
import { CreateProjectModal } from '@/features/projects/components/CreateProjectModal';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, setLanguage } = useI18n();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [expandedSpaces, setExpandedSpaces] = useState<Record<number, boolean>>({});
  const [projectsBySpace, setProjectsBySpace] = useState<Record<number, Project[]>>({});
  const [myTasksExpanded, setMyTasksExpanded] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectModalSpace, setProjectModalSpace] = useState<{ id: number; name: string } | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

  // Project-row menu state (mirrors the space menu, keyed by project id).
  const [activeProjectDropdown, setActiveProjectDropdown] = useState<number | null>(null);
  const [moveSubmenuProject, setMoveSubmenuProject] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [duplicatingProjectId, setDuplicatingProjectId] = useState<number | null>(null);
  const [taskModalProject, setTaskModalProject] = useState<Project | null>(null);

  // Pending delete confirmation (popup instead of window.confirm).
  const [pendingDeleteSpace, setPendingDeleteSpace] = useState<Space | null>(null);
  const [pendingDeleteProject, setPendingDeleteProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close any open menu on an outside click. Only listen while a menu is open,
  // and defer registration by a tick so the click that opened it doesn't close it.
  useEffect(() => {
    if (activeDropdown === null && activeProjectDropdown === null) return;
    const close = () => {
      setActiveDropdown(null);
      setActiveProjectDropdown(null);
      setMoveSubmenuProject(null);
    };
    const id = window.setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('click', close);
    };
  }, [activeDropdown, activeProjectDropdown]);

  // Refetches when sidebarVersion changes — bumped after accepting an
  // invitation, so newly shared spaces appear without a page reload.
  const sidebarVersion = useInvitationStore((s) => s.sidebarVersion);
  useEffect(() => {
    getSpaces().then(data => {
      setSpaces(data);
      // Drop cached project lists so shared projects reload with fresh access.
      setProjectsBySpace({});
    }).catch(err => console.warn("Failed to fetch spaces:", err instanceof Error ? err.message : String(err)));
  }, [sidebarVersion]);

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

  const openCreateProject = (space: Space, e?: React.MouseEvent) => {
    e?.stopPropagation();
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

  const handleDeleteSpace = (space: Space) => {
    setActiveDropdown(null);
    setPendingDeleteSpace(space);
  };

  const confirmDeleteSpace = async () => {
    if (!pendingDeleteSpace) return;
    const spaceId = pendingDeleteSpace.id;
    setIsDeleting(true);
    try {
      await deleteSpace(spaceId);
      setSpaces(prev => prev.filter(s => s.id !== spaceId));
      setPendingDeleteSpace(null);
      if (pathname === `/spaces/${spaceId}`) {
        router.push('/');
      }
    } catch (err) {
      console.warn("Failed to delete space", err instanceof Error ? err.message : String(err));
      alert(err instanceof Error ? err.message : "Failed to delete space");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSpace = (space: Space) => {
    setActiveDropdown(null);
    setEditingSpace(space);
  };

  const handleSpaceUpdated = (updated: Space) => {
    setSpaces(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    setEditingSpace(null);
  };

  const handleCopyLink = (spaceId: number) => {
    setActiveDropdown(null);
    navigator.clipboard?.writeText(`${window.location.origin}/spaces/${spaceId}`)
      .catch(() => {/* clipboard unavailable (e.g. http) — ignore */});
  };

  const handleDuplicateSpace = async (space: Space) => {
    setActiveDropdown(null);
    setDuplicatingId(space.id);
    try {
      const newSpace = await duplicateSpace(space);
      setSpaces(prev => [...prev, newSpace]);
    } catch (err) {
      console.warn("Failed to duplicate space", err instanceof Error ? err.message : String(err));
      alert(err instanceof Error ? err.message : "Failed to duplicate space");
    } finally {
      setDuplicatingId(null);
    }
  };

  // --- Project row actions (mirror the space menu) ---

  const openCreateTask = (project: Project) => {
    setActiveProjectDropdown(null);
    setTaskModalProject(project);
  };

  const handleEditProject = (project: Project) => {
    setActiveProjectDropdown(null);
    setEditingProject(project);
  };

  const handleProjectUpdated = (updated: Project) => {
    setProjectsBySpace(prev => ({
      ...prev,
      [updated.spaceId]: (prev[updated.spaceId] || []).map(p => (p.id === updated.id ? updated : p)),
    }));
    setEditingProject(null);
  };

  const handleCopyProjectLink = (projectId: number, spaceId: number) => {
    setActiveProjectDropdown(null);
    navigator.clipboard?.writeText(`${window.location.origin}/projects/${projectId}?spaceId=${spaceId}`)
      .catch(() => {/* clipboard unavailable (e.g. http) — ignore */});
  };

  const handleDuplicateProject = async (project: Project) => {
    setActiveProjectDropdown(null);
    setDuplicatingProjectId(project.id);
    try {
      const newProject = await duplicateProject(project);
      setProjectsBySpace(prev => ({
        ...prev,
        [project.spaceId]: [...(prev[project.spaceId] || []), newProject],
      }));
    } catch (err) {
      console.warn("Failed to duplicate project", err instanceof Error ? err.message : String(err));
      alert(err instanceof Error ? err.message : "Failed to duplicate project");
    } finally {
      setDuplicatingProjectId(null);
    }
  };

  const handleMoveProject = async (project: Project, targetSpaceId: number) => {
    setActiveProjectDropdown(null);
    setMoveSubmenuProject(null);
    if (project.spaceId === targetSpaceId) return;
    try {
      const updated = await updateProject(project.id, {
        name: project.name,
        description: project.description,
        spaceId: targetSpaceId,
      });
      setProjectsBySpace(prev => {
        const next = { ...prev };
        // Remove from the old space.
        next[project.spaceId] = (next[project.spaceId] || []).filter(p => p.id !== project.id);
        // Add to the target space (only if we've already loaded that space's projects).
        if (next[targetSpaceId]) {
          next[targetSpaceId] = [...next[targetSpaceId], updated];
        }
        return next;
      });
    } catch (err) {
      console.warn("Failed to move project", err instanceof Error ? err.message : String(err));
      alert(err instanceof Error ? err.message : "Failed to move project");
    }
  };

  const handleDeleteProject = (project: Project) => {
    setActiveProjectDropdown(null);
    setPendingDeleteProject(project);
  };

  const confirmDeleteProject = async () => {
    if (!pendingDeleteProject) return;
    const project = pendingDeleteProject;
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      setProjectsBySpace(prev => ({
        ...prev,
        [project.spaceId]: (prev[project.spaceId] || []).filter(p => p.id !== project.id),
      }));
      setPendingDeleteProject(null);
      if (pathname === `/projects/${project.id}`) {
        router.push(`/spaces/${project.spaceId}`);
      }
    } catch (err) {
      console.warn("Failed to delete project", err instanceof Error ? err.message : String(err));
      alert(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setIsDeleting(false);
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
          <span className="section-title">{t.home}</span>
          <div className="nav-item" onClick={() => router.push('/inbox')}>
            <Inbox size={16} /> <span className="item-name">{t.inbox}</span>
          </div>
          <div className="nav-item" onClick={() => router.push('/replies')}>
            <MessageSquareReply size={16} /> <span className="item-name">{t.replies}</span>
          </div>
          <div className="nav-item" onClick={() => router.push('/assigned-comments')}>
            <MessageSquare size={16} /> <span className="item-name">{t.assignedComments}</span>
          </div>

          {/* My Tasks Section */}
          <div className="project-group" style={{ marginTop: '4px' }}>
            <div className="nav-item project-item" onClick={() => setMyTasksExpanded(!myTasksExpanded)}>
              <span className="space-icon-toggle">
                <User size={16} className="text-secondary" />
                <span className="hover-chevron">
                  {myTasksExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              </span>
              <span className="item-name space-name" style={{ fontWeight: 500 }}>{t.myTasks}</span>
            </div>
            
            {myTasksExpanded && (
              <div className="lists-container" style={{ paddingLeft: '8px' }}>
                <div 
                  className={`nav-item ${pathname === '/my-tasks/assigned' ? 'active' : ''}`}
                  onClick={() => router.push('/my-tasks/assigned')}
                >
                  <span className="nav-leading-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#5b5b5b', fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>
                    A
                  </span>
                  <span className="item-name">{t.assignedToMe}</span>
                </div>
                
                <div 
                  className={`nav-item ${pathname === '/my-tasks/today' ? 'active' : ''}`}
                  onClick={() => router.push('/my-tasks/today')}
                >
                  <CalendarClock size={16} className="text-secondary" style={{ minWidth: '16px' }} />
                  <span className="item-name">{t.todayOverdue}</span>
                </div>
                
                <div 
                  className={`nav-item ${pathname === '/my-tasks/personal' ? 'active' : ''}`}
                  onClick={() => router.push('/my-tasks/personal')}
                >
                  <UserCircle size={16} className="text-secondary" style={{ minWidth: '16px' }} />
                  <span className="item-name">{t.personalList}</span>
                </div>
              </div>
            )}
          </div>
          <div className={`nav-item ${pathname.startsWith('/dashboards') ? 'active' : ''}`} onClick={() => router.push('/dashboards')}>
            <BarChart3 size={16} /> <span className="item-name">{t.dashboards || 'Dashboard'}</span>
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
                    <span
                      className="space-icon-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSpace(space.id);
                      }}
                      title={isSpaceExpanded ? 'Collapse' : 'Expand'}
                    >
                      <SpaceIcon icon={space.icon} color={space.color} size={22} className="space-nav-icon" />
                      <span className="hover-chevron">
                        {isSpaceExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </span>
                    <span className="item-name space-name">{space.name}</span>
                    <div className="space-actions">
                      <button className="action-btn" onClick={(e) => openCreateProject(space, e)} title={t.addProject}>
                        <Plus size={15} />
                      </button>
                      <div className="dropdown-container" style={{ position: 'relative' }}>
                        <button 
                          className="action-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === space.id ? null : space.id);
                          }} 
                          title="More options"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {activeDropdown === space.id && (
                          <div className="context-menu" onClick={(e) => e.stopPropagation()}>
                            <button className="context-menu-item" onClick={() => handleEditSpace(space)}>
                              <Pencil size={14} /> {t.editSpace}
                            </button>
                            <button className="context-menu-item" onClick={() => { setActiveDropdown(null); openCreateProject(space); }}>
                              <Plus size={14} /> {t.addProject}
                            </button>
                            <button className="context-menu-item" onClick={() => handleCopyLink(space.id)}>
                              <Link2 size={14} /> {t.copyLink}
                            </button>
                            <button className="context-menu-item" onClick={() => handleDuplicateSpace(space)} disabled={duplicatingId === space.id}>
                              <Copy size={14} /> {duplicatingId === space.id ? t.duplicating : t.duplicate}
                            </button>
                            <div className="context-menu-divider" />
                            <button className="context-menu-item danger" onClick={() => handleDeleteSpace(space)}>
                              <Trash2 size={14} /> {t.deleteSpace}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nested Projects */}
                  {isSpaceExpanded && (
                    <div className="lists-container" style={{ paddingLeft: '8px' }}>
                      {spaceProjects.length === 0 ? (
                        <div className="nav-item add-project-row" onClick={(e) => openCreateProject(space, e)}>
                          <Plus size={14} /> <span>{t.addProject}</span>
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
                                <span className="nav-leading-icon">
                                  <CheckSquare size={16} className={isProjectActive ? "text-primary" : ""} />
                                </span>
                                <span className="item-name project-name">{project.name}</span>
                                <div className="space-actions">
                                  <button className="action-btn" onClick={(e) => { e.stopPropagation(); openCreateTask(project); }} title="Add task">
                                    <Plus size={15} />
                                  </button>
                                  <div className="dropdown-container" style={{ position: 'relative' }}>
                                    <button
                                      className="action-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMoveSubmenuProject(null);
                                        setActiveProjectDropdown(activeProjectDropdown === project.id ? null : project.id);
                                      }}
                                      title="More options"
                                    >
                                      <MoreHorizontal size={16} />
                                    </button>

                                    {activeProjectDropdown === project.id && (
                                      <div className="context-menu" onClick={(e) => e.stopPropagation()}>
                                        <button className="context-menu-item" onClick={() => handleEditProject(project)}>
                                          <Pencil size={14} /> {t.editProject}
                                        </button>
                                        <button className="context-menu-item" onClick={() => openCreateTask(project)}>
                                          <Plus size={14} /> {t.addTask}
                                        </button>
                                        <button className="context-menu-item" onClick={() => handleCopyProjectLink(project.id, space.id)}>
                                          <Link2 size={14} /> {t.copyLink}
                                        </button>
                                        <button className="context-menu-item" onClick={() => handleDuplicateProject(project)} disabled={duplicatingProjectId === project.id}>
                                          <Copy size={14} /> {duplicatingProjectId === project.id ? t.duplicating : t.duplicate}
                                        </button>
                                        <div className="context-submenu-container" style={{ position: 'relative' }}>
                                          <button
                                            className="context-menu-item"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setMoveSubmenuProject(moveSubmenuProject === project.id ? null : project.id);
                                            }}
                                          >
                                            <FolderInput size={14} /> {t.move}
                                            <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
                                          </button>
                                          {moveSubmenuProject === project.id && (
                                            <div className="context-menu context-submenu">
                                              {spaces.filter(s => s.id !== project.spaceId).length === 0 ? (
                                                <div className="context-menu-empty">{t.noOtherSpaces}</div>
                                              ) : (
                                                spaces
                                                  .filter(s => s.id !== project.spaceId)
                                                  .map(s => (
                                                    <button
                                                      key={s.id}
                                                      className="context-menu-item"
                                                      onClick={() => handleMoveProject(project, s.id)}
                                                    >
                                                      <SpaceIcon icon={s.icon} color={s.color} size={16} />
                                                      <span className="item-name">{s.name}</span>
                                                    </button>
                                                  ))
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <div className="context-menu-divider" />
                                        <button className="context-menu-item danger" onClick={() => handleDeleteProject(project)}>
                                          <Trash2 size={14} /> {t.deleteProject}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
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
            <span>{t.newSpace}</span>
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

      {editingSpace && (
        <CreateSpaceModal
          space={editingSpace}
          onClose={() => setEditingSpace(null)}
          onSuccess={handleSpaceUpdated}
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

      {editingProject && (
        <CreateProjectModal
          spaceId={editingProject.spaceId}
          spaceName={spaces.find(s => s.id === editingProject.spaceId)?.name ?? ''}
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={handleProjectUpdated}
        />
      )}

      {taskModalProject && (
        <CreateTaskModal
          projects={[taskModalProject]}
          defaultProjectId={taskModalProject.id}
          onClose={() => setTaskModalProject(null)}
        />
      )}

      {pendingDeleteSpace && (
        <ConfirmDialog
          title={t.deleteSpace}
          message={t.confirmDeleteSpace}
          confirmLabel={t.deleteSpace}
          danger
          loading={isDeleting}
          onConfirm={confirmDeleteSpace}
          onClose={() => setPendingDeleteSpace(null)}
        />
      )}

      {pendingDeleteProject && (
        <ConfirmDialog
          title={t.deleteProject}
          message={t.deleteProjectConfirm.replace('{name}', pendingDeleteProject.name)}
          confirmLabel={t.deleteProject}
          danger
          loading={isDeleting}
          onConfirm={confirmDeleteProject}
          onClose={() => setPendingDeleteProject(null)}
        />
      )}
    </aside>
  );
};
