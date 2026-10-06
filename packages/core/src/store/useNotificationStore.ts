import { create } from 'zustand';
import type { CommentItem } from '../features/comments/types';
import type { TaskChange } from '../features/tasks/types';

// Live notifications, fed by the SignalR connection and shown as pop-ups at
// the top of the screen by both the web and mobile apps: a new comment, or a
// change to a task you're assigned to.
export type AppNotification =
  | { id: string; kind: 'comment'; comment: CommentItem }
  | { id: string; kind: 'task'; change: TaskChange };

interface NotificationState {
  notifications: AppNotification[];
  // Bumped on every new comment so open lists (Replies, a task's comments)
  // can refresh right away instead of waiting for their next poll.
  commentsVersion: number;
  lastComment: CommentItem | null;
  // The latest live task change, so an open task's history can reload.
  lastTaskChange: TaskChange | null;
  // The number on the Replies badge (replies not opened yet). Loaded from the
  // backend by useUnreadReplies; goes up by one on each live comment.
  unreadReplies: number;

  setUnreadReplies: (count: number) => void;
  pushComment: (comment: CommentItem) => void;
  pushTaskChange: (change: TaskChange) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const MAX_VISIBLE = 3;

// Newest on top; keep only a few on screen at once.
const withNew = (list: AppNotification[], n: AppNotification) => [n, ...list].slice(0, MAX_VISIBLE);

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  commentsVersion: 0,
  lastComment: null,
  lastTaskChange: null,
  unreadReplies: 0,

  setUnreadReplies: (count) => set({ unreadReplies: Math.max(0, count) }),

  pushComment: (comment) =>
    set((state) => ({
      notifications: withNew(state.notifications, { id: `comment-${comment.id}-${Date.now()}`, kind: 'comment', comment }),
      commentsVersion: state.commentsVersion + 1,
      lastComment: comment,
      // Live comments never come from the current user (the backend skips the author).
      unreadReplies: state.unreadReplies + 1,
    })),

  pushTaskChange: (change) =>
    set((state) => ({
      notifications: withNew(state.notifications, {
        id: `task-${change.activity.id}-${Date.now()}`,
        kind: 'task',
        change,
      }),
      lastTaskChange: change,
    })),

  dismiss: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),

  // On logout: drop pop-ups and the badge so the next user starts clean.
  clear: () => set({ notifications: [], unreadReplies: 0, lastComment: null, lastTaskChange: null }),
}));

// Text for the notification title, e.g. "Amr Khaled commented on Fix login".
export const commentNotificationTitle = (comment: CommentItem): string => {
  const who = comment.author ? `${comment.author.firstName} ${comment.author.lastName}`.trim() : 'Someone';
  return comment.taskTitle ? `${who} commented on ${comment.taskTitle}` : `${who} commented`;
};

// Where a notification leads when tapped.
export const notificationTarget = (n: AppNotification): { taskId: number; projectId: number } =>
  n.kind === 'comment'
    ? { taskId: n.comment.taskItemId, projectId: n.comment.projectId }
    : { taskId: n.change.taskId, projectId: n.change.projectId };
