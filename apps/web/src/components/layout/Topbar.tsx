"use client";

import React, { useEffect, useRef, useState } from 'react';
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

// No Tailwind preflight here, so reset the browser's default button border/background/font.
const menuItemBase =
  'group flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-2.5 py-2 text-start font-[inherit] text-[15px] font-medium transition-colors';
const menuItem = `${menuItemBase} text-ink hover:bg-hover`;
// Icon sits in a soft tile that picks up the accent on hover.
const menuIcon =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-hover text-muted transition-colors group-hover:bg-accent-soft group-hover:text-ink';

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
      <div className="min-w-0 flex-1" />

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
                className="absolute end-0 top-[calc(100%+10px)] z-50 w-80 origin-top-right rounded-2xl border border-line bg-surface p-2 shadow-2xl shadow-black/25 rtl:origin-top-left"
              >
                {/* Profile card: accent-tinted banner, large avatar with a quick
                    "change picture" overlay, then name and email. */}
                <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--accent-muted-strong),transparent_75%)] p-4">
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setPictureOpen(true);
                      }}
                      title={t.profilePicture}
                      className="group/avatar relative shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0 ring-2 ring-surface"
                    >
                      <UserAvatar
                        firstName={user?.firstName}
                        lastName={user?.lastName}
                        avatarUrl={user?.avatarUrl}
                        className="user-avatar xl"
                      />
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover/avatar:opacity-100">
                        <Camera size={18} />
                      </span>
                    </button>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-ink">{fullName}</p>
                      <p className="mt-0.5 truncate text-[13px] text-muted">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-0.5">
                  {[
                    { icon: Camera, label: t.profilePicture, open: () => setPictureOpen(true) },
                    { icon: Palette, label: t.theme, open: () => setThemeOpen(true) },
                    { icon: BellRing, label: t.notificationSettings, open: () => setNotifSettingsOpen(true) },
                  ].map(({ icon: Icon, label, open }) => (
                    <button
                      key={label}
                      role="menuitem"
                      className={menuItem}
                      onClick={() => {
                        setMenuOpen(false);
                        open();
                      }}
                    >
                      <span className={menuIcon}>
                        <Icon size={16} />
                      </span>
                      <span className="flex-1 truncate">{label}</span>
                      <ChevronRight
                        size={15}
                        className="text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                      />
                    </button>
                  ))}
                </div>

                <div className="mx-2 my-2 h-px bg-line" />
                <button
                  role="menuitem"
                  className={`${menuItemBase} text-red-500 hover:bg-red-500/10`}
                  onClick={handleLogout}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                    <LogOut size={16} />
                  </span>
                  <span className="flex-1">{t.logout}</span>
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
