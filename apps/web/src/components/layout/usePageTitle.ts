"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { create } from 'zustand';
import { useSpaceStore } from '@task/core/store/useSpaceStore';
import { useI18n } from '@/contexts/I18nContext';

// The name shown at the top of every page (in the top bar): the name of the
// page that is open, e.g. "Home", "Replies", a space's name or a list's name.

// Pages whose name only they know (e.g. a dashboard) register it here.
interface PageTitleState {
  titles: Record<string, string>;
  setTitle: (path: string, title: string) => void;
}

const usePageTitleStore = create<PageTitleState>((set) => ({
  titles: {},
  setTitle: (path, title) =>
    set((state) => (state.titles[path] === title ? state : { titles: { ...state.titles, [path]: title } })),
}));

// Call from a page to show its own name in the top bar.
export function useRegisterPageTitle(title: string | null | undefined) {
  const pathname = usePathname();
  useEffect(() => {
    if (title) usePageTitleStore.getState().setTitle(pathname, title);
  }, [pathname, title]);
}

export function usePageTitle(): string {
  const pathname = usePathname();
  const { t } = useI18n();
  const registered = usePageTitleStore((s) => s.titles[pathname]);
  const space = useSpaceStore((s) => s.space);
  const projects = useSpaceStore((s) => s.projects);

  if (registered) return registered;

  if (pathname === '/') return t.home;
  if (pathname.startsWith('/replies')) return t.replies;
  if (pathname.startsWith('/assigned-comments')) return t.assignedComments;
  if (pathname.startsWith('/my-tasks/assigned')) return t.assignedToMe;
  if (pathname.startsWith('/my-tasks/today')) return t.todayOverdue;
  if (pathname.startsWith('/my-tasks/personal')) return t.personalList;
  if (pathname.startsWith('/my-tasks')) return t.myTasks;
  if (pathname.startsWith('/dashboards')) return t.dashboards;
  if (pathname.startsWith('/users')) return t.manageUsers;

  // A space or a list: use its own name once it has loaded.
  const spaceMatch = pathname.match(/^\/spaces\/(\d+)/);
  if (spaceMatch) {
    return space && space.id === Number(spaceMatch[1]) ? space.name : t.spaces;
  }
  const projectMatch = pathname.match(/^\/projects\/(\d+)/);
  if (projectMatch) {
    const project = projects.find((p) => p.id === Number(projectMatch[1]));
    return project ? project.name : '';
  }

  return t.home;
}
