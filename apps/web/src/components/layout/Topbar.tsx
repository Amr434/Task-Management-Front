"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { BellRing, Camera, ChevronRight, LogOut, Menu, Palette } from 'lucide-react';
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
import { useMobileNav } from './mobileNav';

type Crumb = { label: string; href?: string };

const menuItem =
  'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm text-ink transition-colors hover:bg-hover';

export const Topbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const openNav = useMobileNav((s) => s.open);

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    useInvitationStore.getState().disconnectSignalR();
    await logout();
    router.replace('/login');
  };

  // Section names come from the existing dictionary so they follow the language.
  const crumbs: Crumb[] = [{ label: t.home, href: '/' }];
  if (pathname.startsWith('/dashboards')) crumbs.push({ label: t.dashboards });
  else if (pathname.startsWith('/my-tasks')) {
    crumbs.push({ label: t.myTasks });
    if (pathname.endsWith('/assigned')) crumbs.push({ label: t.assignedToMe });
    else if (pathname.endsWith('/today')) crumbs.push({ label: t.todayOverdue });
    else if (pathname.endsWith('/personal')) crumbs.push({ label: t.personalList });
  } else if (pathname.startsWith('/assigned-comments')) crumbs.push({ label: t.assignedComments });
  else if (pathname.startsWith('/replies')) crumbs.push({ label: t.replies });
  else if (pathname.startsWith('/users')) crumbs.push({ label: t.manageUsers });
  else if (pathname.startsWith('/spaces') || pathname.startsWith('/projects')) crumbs.push({ label: t.spaces });

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <header className="relative z-30 flex h-(--topbar-height) shrink-0 items-center justify-between gap-2 border-b border-line bg-chrome px-3 md:gap-4 md:px-6">
      {/* Phones only: opens the sidebar as a slide-in menu. */}
      <button
        onClick={() => openNav(pathname)}
        aria-label={t.menu}
        className="-ms-1 flex shrink-0 cursor-pointer items-center rounded-lg border-0 bg-transparent p-1.5 text-ink hover:bg-hover md:hidden"
      >
        <Menu size={22} />
      </button>
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={c.label} className={`flex min-w-0 items-center gap-1.5${last ? '' : ' max-md:hidden'}`}>
                {i > 0 && <ChevronRight size={14} className="text-muted/60 max-md:hidden rtl:rotate-180" aria-hidden />}
                {last || !c.href ? (
                  <span aria-current={last ? 'page' : undefined} className="truncate font-semibold text-ink">
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="text-muted transition-colors hover:text-ink">
                    {c.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex items-center gap-1.5 md:gap-3">
        <TaskSearch />
        <NotificationBell onOpenSettings={() => setNotifSettingsOpen(true)} />
        <InvitationBell />

        <div className="relative" ref={menuRef}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setMenuOpen((v) => !v)}
            title={user?.email}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex cursor-pointer items-center rounded-full ring-2 ring-transparent transition-shadow hover:ring-accent-line focus-visible:ring-accent"
          >
            <UserAvatar firstName={user?.firstName} lastName={user?.lastName} avatarUrl={user?.avatarUrl} />
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="absolute end-0 top-[calc(100%+8px)] z-50 w-64 origin-top-right rounded-xl border border-line bg-surface p-1.5 shadow-lg shadow-black/10 rtl:origin-top-left"
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <UserAvatar
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    avatarUrl={user?.avatarUrl}
                    className="user-avatar large"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{fullName}</p>
                    <p className="truncate text-xs text-muted">{user?.email}</p>
                  </div>
                </div>
                <div className="my-1 h-px bg-line" />
                <button
                  role="menuitem"
                  className={menuItem}
                  onClick={() => {
                    setMenuOpen(false);
                    setPictureOpen(true);
                  }}
                >
                  <Camera size={15} className="text-muted" /> {t.profilePicture}
                </button>
                <button
                  role="menuitem"
                  className={menuItem}
                  onClick={() => {
                    setMenuOpen(false);
                    setThemeOpen(true);
                  }}
                >
                  <Palette size={15} className="text-muted" /> {t.theme}
                </button>
                <button
                  role="menuitem"
                  className={menuItem}
                  onClick={() => {
                    setMenuOpen(false);
                    setNotifSettingsOpen(true);
                  }}
                >
                  <BellRing size={15} className="text-muted" /> {t.notificationSettings}
                </button>
                <div className="my-1 h-px bg-line" />
                <button
                  role="menuitem"
                  className={`${menuItem} text-red-600 hover:bg-red-500/10`}
                  onClick={handleLogout}
                >
                  <LogOut size={15} /> {t.logout}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {themeOpen && <ThemeModal onClose={() => setThemeOpen(false)} />}
      {pictureOpen && <ProfilePictureModal onClose={() => setPictureOpen(false)} />}
      {notifSettingsOpen && <NotificationSettingsModal onClose={() => setNotifSettingsOpen(false)} />}
    </header>
  );
};
