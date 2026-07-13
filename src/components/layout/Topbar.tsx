"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useInvitationStore } from '@/features/invitations/store/useInvitationStore';
import { InvitationBell } from './InvitationBell';

export const Topbar = () => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() || user.email.charAt(0).toUpperCase()
    : '?';

  const handleLogout = async () => {
    setMenuOpen(false);
    useInvitationStore.getState().disconnectSignalR();
    await logout();
    router.replace('/login');
  };

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
        <InvitationBell />
        <button className="icon-btn"><Settings size={20} /></button>
        <div className="user-menu" ref={menuRef}>
          <button className="user-avatar-btn" onClick={() => setMenuOpen((v) => !v)} title={user?.email}>
            <span className="user-avatar">{initials}</span>
          </button>
          {menuOpen && (
            <div className="user-menu-popover">
              <div className="user-menu-header">
                <span className="user-avatar large">{initials}</span>
                <div className="user-menu-identity">
                  <span className="user-menu-name">{user ? `${user.firstName} ${user.lastName}` : ''}</span>
                  <span className="user-menu-email">{user?.email}</span>
                </div>
              </div>
              <button className="user-menu-item danger" onClick={handleLogout}>
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
