"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlarmClock, Bell, CheckCheck, Mail, Settings } from 'lucide-react';
import { useNotificationCenterStore } from '@task/core/features/notifications/store';
import { describeNotification } from '@task/core/features/notifications/describe';
import { NotificationType, type NotificationItem } from '@task/core/features/notifications/types';
import { timeAgo } from '@task/core/features/comments/types';
import { useI18n } from '@/contexts/I18nContext';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { openTaskDetail } from '@/features/tasks/openTask';

interface NotificationBellProps {
  // Opens the email settings (owned by the Topbar).
  onOpenSettings: () => void;
}

// The saved notification list: everything the pop-ups showed, plus @mentions
// and due date reminders, kept until read. New ones arrive live.
export const NotificationBell: React.FC<NotificationBellProps> = ({ onOpenSettings }) => {
  const { t, language } = useI18n();
  const router = useRouter();
  const { items, unreadCount, loaded, loading, hasMore, refresh, loadMore, markRead, markAllRead } =
    useNotificationCenterStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Loaded here as well as on SignalR connect, so the badge shows even if
  // the live connection is slow to start.
  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded, refresh]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const handleClick = (n: NotificationItem) => {
    markRead(n.id);
    setOpen(false);
    const { target } = describeNotification(n, t, language);
    if (target.kind === 'task') {
      openTaskDetail(target.taskId, target.projectId, n.type === NotificationType.TaskChanged);
    } else {
      router.push(target.path);
    }
  };

  return (
    <div className="invitation-bell-container" ref={menuRef}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)} title={t.notifications}>
        <Bell size={20} />
        {unreadCount > 0 && <span className="invitation-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="invitation-popover notification-popover">
          <div className="notification-popover-header">
            <span>{t.notifications}</span>
            <div className="notification-popover-actions">
              {unreadCount > 0 && (
                <button type="button" className="notification-link-btn" onClick={() => markAllRead()}>
                  <CheckCheck size={14} /> {t.markAllRead}
                </button>
              )}
              <button
                type="button"
                className="notification-icon-btn"
                title={t.notificationSettings}
                aria-label={t.notificationSettings}
                onClick={() => {
                  setOpen(false);
                  onOpenSettings();
                }}
              >
                <Settings size={14} />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {items.length === 0 ? (
              <div className="invitation-empty">{loading ? '…' : t.noNotifications}</div>
            ) : (
              items.map((n) => <NotificationRow key={n.id} notification={n} onClick={() => handleClick(n)} />)
            )}
            {hasMore && items.length > 0 && (
              <button type="button" className="notification-load-more" disabled={loading} onClick={() => loadMore()}>
                {t.loadMore}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationRow = ({ notification, onClick }: { notification: NotificationItem; onClick: () => void }) => {
  const { t, language } = useI18n();
  const view = describeNotification(notification, t, language);
  const isReminder =
    notification.type === NotificationType.TaskDueSoon || notification.type === NotificationType.TaskOverdue;
  const isOverdue = notification.type === NotificationType.TaskOverdue;

  return (
    <button
      type="button"
      className={`notification-item${notification.isRead ? '' : ' unread'}`}
      onClick={onClick}
    >
      {view.person ? (
        <UserAvatar
          firstName={view.person.firstName}
          lastName={view.person.lastName}
          avatarUrl={view.person.avatarUrl}
          className="user-avatar"
        />
      ) : (
        <span className={`notification-item-icon${isOverdue ? ' overdue' : ''}`}>
          {isReminder ? <AlarmClock size={15} /> : <Mail size={15} />}
        </span>
      )}
      <span className="notification-item-text">
        <span className="notification-item-title">{view.title}</span>
        {view.body && <span className="notification-item-body">{view.body}</span>}
        <span className="notification-item-time">{timeAgo(notification.createdAtUtc)}</span>
      </span>
      {!notification.isRead && <span className="notification-unread-dot" aria-hidden />}
    </button>
  );
};
