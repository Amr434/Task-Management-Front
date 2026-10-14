"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { TaskDetailSidebar } from '@/features/tasks/components/TaskDetailSidebar';
import { CommentNotifications } from './CommentNotifications';
import { useMobileNav } from './mobileNav';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  // Phones only: is the slide-in menu open on this page?
  const navOpen = useMobileNav((s) => s.openOn === pathname);
  const closeNav = useMobileNav((s) => s.close);

  return (
    <div className={`app-container${navOpen ? ' nav-open' : ''}`}>
      <Sidebar />
      <div className="sidebar-backdrop" onClick={closeNav} />
      <div className="main-wrapper">
        <Topbar />
        <main className="main-content">
          {children}
        </main>
      </div>
      <TaskDetailSidebar />
      <CommentNotifications />
    </div>
  );
};
