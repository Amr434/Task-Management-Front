"use client";

import React, { useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import {
  useNotificationStore,
  commentNotificationTitle,
  notificationTarget,
  AppNotification,
} from '@task/core/store/useNotificationStore';
import { describeActivity } from '@task/core/features/tasks/activity';
import { userDisplayName } from '@task/core/features/tasks/types';
import { useI18n } from '@/contexts/I18nContext';
import { getTasksByProject } from '@task/core/features/tasks/api';
import { useSpaceStore } from '@task/core/store/useSpaceStore';
import { UserAvatar } from '@/components/ui/UserAvatar';

const AUTO_HIDE_MS = 7000;

// Pop-up notifications at the top of the page when someone comments on a task
// you can see, or changes a task you're assigned to (sent live by the
// backend). Click one to open the task.
export const CommentNotifications = () => {
  const notifications = useNotificationStore((s) => s.notifications);
  if (notifications.length === 0) return null;
  return (
    <div className="comment-toasts" role="status" aria-live="polite">
      {notifications.map((n) => (
        <CommentToast key={n.id} notification={n} />
      ))}
    </div>
  );
};

const CommentToast = ({ notification }: { notification: AppNotification }) => {
  const dismiss = useNotificationStore((s) => s.dismiss);
  const setTasksForProject = useSpaceStore((s) => s.setTasksForProject);
  const setDetailTaskId = useSpaceStore((s) => s.setDetailTaskId);
  const { t, language } = useI18n();
  const { taskId, projectId } = notificationTarget(notification);

  // Who, headline, detail and location for either kind of notification.
  let person, title, body, where;
  if (notification.kind === 'comment') {
    const { comment } = notification;
    person = comment.author;
    title = commentNotificationTitle(comment);
    body = comment.text;
    where = [comment.spaceName, comment.projectName].filter(Boolean).join(' / ');
  } else {
    const { activity, taskTitle } = notification.change;
    person = activity.user;
    title = taskTitle;
    body = `${activity.user ? userDisplayName(activity.user) : '—'} ${describeActivity(activity, t, language)}`;
  }

  useEffect(() => {
    const timer = setTimeout(() => dismiss(notification.id), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [notification.id, dismiss]);

  // Open the task's detail panel (loading the project's tasks into the store first).
  const open = async () => {
    dismiss(notification.id);
    try {
      const { tasksByProjectId } = useSpaceStore.getState();
      // Always reload for a task change: the stored copy is out of date.
      if (notification.kind === 'task' || !tasksByProjectId[projectId]?.some((tk) => tk.id === taskId)) {
        setTasksForProject(projectId, await getTasksByProject(projectId));
      }
      setDetailTaskId(taskId);
    } catch (e) {
      console.warn('Failed to open task', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="comment-toast" onClick={open}>
      {person ? (
        <UserAvatar
          firstName={person.firstName}
          lastName={person.lastName}
          avatarUrl={person.avatarUrl}
          className="user-avatar"
        />
      ) : (
        <span className="user-avatar"><MessageSquare size={14} /></span>
      )}
      <div className="comment-toast-text">
        <span className="comment-toast-title">{title}</span>
        <span className="comment-toast-body">{body}</span>
        {where && <span className="comment-toast-where">{where}</span>}
      </div>
      <button
        type="button"
        className="comment-toast-close"
        aria-label="Dismiss"
        onClick={(e) => {
          e.stopPropagation();
          dismiss(notification.id);
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
