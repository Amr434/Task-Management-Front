"use client";

import React, { useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useNotificationStore, commentNotificationTitle, CommentNotification } from '@task/core/store/useNotificationStore';
import { getTasksByProject } from '@task/core/features/tasks/api';
import { useSpaceStore } from '@task/core/store/useSpaceStore';
import { UserAvatar } from '@/components/ui/UserAvatar';

const AUTO_HIDE_MS = 7000;

// Pop-up notifications at the top of the page when someone comments on a task
// you can see (sent live by the backend). Click one to open the task.
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

const CommentToast = ({ notification }: { notification: CommentNotification }) => {
  const dismiss = useNotificationStore((s) => s.dismiss);
  const setTasksForProject = useSpaceStore((s) => s.setTasksForProject);
  const setDetailTaskId = useSpaceStore((s) => s.setDetailTaskId);
  const { comment } = notification;

  useEffect(() => {
    const timer = setTimeout(() => dismiss(notification.id), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [notification.id, dismiss]);

  // Open the task's detail panel (loading the project's tasks into the store first).
  const open = async () => {
    dismiss(notification.id);
    try {
      const { tasksByProjectId } = useSpaceStore.getState();
      if (!tasksByProjectId[comment.projectId]?.some((t) => t.id === comment.taskItemId)) {
        setTasksForProject(comment.projectId, await getTasksByProject(comment.projectId));
      }
      setDetailTaskId(comment.taskItemId);
    } catch (e) {
      console.warn('Failed to open task', e instanceof Error ? e.message : String(e));
    }
  };

  const where = [comment.spaceName, comment.projectName].filter(Boolean).join(' / ');

  return (
    <div className="comment-toast" onClick={open}>
      {comment.author ? (
        <UserAvatar
          firstName={comment.author.firstName}
          lastName={comment.author.lastName}
          avatarUrl={comment.author.avatarUrl}
          className="user-avatar"
        />
      ) : (
        <span className="user-avatar"><MessageSquare size={14} /></span>
      )}
      <div className="comment-toast-text">
        <span className="comment-toast-title">{commentNotificationTitle(comment)}</span>
        <span className="comment-toast-body">{comment.text}</span>
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
