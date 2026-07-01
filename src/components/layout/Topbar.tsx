import React from 'react';
import { Search, UserCircle, Settings } from 'lucide-react';

export const Topbar = () => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Placeholder for breadcrumbs or context */}
        <span className="breadcrumbs">Task Management / Home</span>
      </div>
      <div className="topbar-right">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search..." />
        </div>
        <button className="icon-btn"><Settings size={20} /></button>
        <button className="icon-btn"><UserCircle size={24} /></button>
      </div>
    </header>
  );
};
