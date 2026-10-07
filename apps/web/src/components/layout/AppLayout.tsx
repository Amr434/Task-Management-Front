import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { TaskDetailSidebar } from '@/features/tasks/components/TaskDetailSidebar';
import { CommentNotifications } from './CommentNotifications';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="app-container">
      <Sidebar />
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
