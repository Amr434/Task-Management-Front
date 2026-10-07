"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Palette, Camera, BellRing } from 'lucide-react';
import { ThemeModal } from '@/features/theme/components/ThemeModal';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { useI18n } from '@/contexts/I18nContext';
import { useInvitationStore } from '@task/core/features/invitations/store/useInvitationStore';
import { InvitationBell } from './InvitationBell';
import { NotificationBell } from './NotificationBell';
import { NotificationSettingsModal } from '@/features/users/components/NotificationSettingsModal';
import { TaskSearch } from '@/features/tasks/components/TaskSearch';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ProfilePictureModal } from '@/features/users/components/ProfilePictureModal';
import { usePageTitle } from './usePageTitle';

export const Topbar = () => {
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const pageTitle = usePageTitle();

  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [pictureOpen, setPictureOpen] = useState(false);
  const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    useInvitationStore.getState().disconnectSignalR();
    await logout();
    router.replace('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* The name of the page that is open. */}
        <div className="page-title">{pageTitle}</div>
      </div>
      <div className="topbar-right">
        <TaskSearch />
        <NotificationBell onOpenSettings={() => setNotifSettingsOpen(true)} />
        <InvitationBell />
        <div className="user-menu" ref={menuRef}>
          <button className="user-avatar-btn" onClick={() => setMenuOpen((v) => !v)} title={user?.email}>
            <UserAvatar firstName={user?.firstName} lastName={user?.lastName} avatarUrl={user?.avatarUrl} />
          </button>
          {menuOpen && (
            <div className="user-menu-popover">
              <div className="user-menu-header">
                <UserAvatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  avatarUrl={user?.avatarUrl}
                  className="user-avatar large"
                />
                <div className="user-menu-identity">
                  <span className="user-menu-name">{user ? `${user.firstName} ${user.lastName}` : ''}</span>
                  <span className="user-menu-email">{user?.email}</span>
                </div>
              </div>
              <button
                className="user-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  setPictureOpen(true);
                }}
              >
                <Camera size={14} /> {t.profilePicture}
              </button>
              <button
                className="user-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  setThemeOpen(true);
                }}
              >
                <Palette size={14} /> {t.theme}
              </button>
              <button
                className="user-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  setNotifSettingsOpen(true);
                }}
              >
                <BellRing size={14} /> {t.notificationSettings}
              </button>
              <button className="user-menu-item danger" onClick={handleLogout}>
                <LogOut size={14} /> {t.logout}
              </button>
            </div>
          )}
        </div>
      </div>
      {themeOpen && <ThemeModal onClose={() => setThemeOpen(false)} />}
      {pictureOpen && <ProfilePictureModal onClose={() => setPictureOpen(false)} />}
      {notifSettingsOpen && <NotificationSettingsModal onClose={() => setNotifSettingsOpen(false)} />}
    </header>
  );
};
