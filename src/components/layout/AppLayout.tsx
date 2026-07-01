import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

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
    </div>
  );
};
