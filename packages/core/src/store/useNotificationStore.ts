import { create } from 'zustand';
import type { CommentItem } from '../features/comments/types';

// Live "new comment" notifications, fed by the SignalR connection and shown
// as pop-ups at the top of the screen by both the web and mobile apps.
export interface CommentNotification {
  id: string;
  comment: CommentItem;
}

interface NotificationState {
  notifications: CommentNotification[];
  // Bumped on every new comment so open lists (Replies, a task's comments)
  // can refresh right away instead of waiting for their next poll.
  commentsVersion: number;
  lastComment: CommentItem | null;
  // The number on the Replies badge (replies not opened yet). Loaded from the
  // backend by useUnreadReplies; goes up by one on each live comment.
  unreadReplies: number;

  setUnreadReplies: (count: number) => void;
  pushComment: (comment: CommentItem) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const MAX_VISIBLE = 3;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  commentsVersion: 0,
  lastComment: null,
  unreadReplies: 0,

  setUnreadReplies: (count) => set({ unreadReplies: Math.max(0, count) }),

  pushComment: (comment) =>
    set((state) => ({
      // Newest on top; keep only a few on screen at once.
      notifications: [{ id: `comment-${comment.id}-${Date.now()}`, comment }, ...state.notifications].slice(0, MAX_VISIBLE),
      commentsVersion: state.commentsVersion + 1,
      lastComment: comment,
      // Live comments never come from the current user (the backend skips the author).
      unreadReplies: state.unreadReplies + 1,
    })),

  dismiss: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),

  // On logout: drop pop-ups and the badge so the next user starts clean.
  clear: () => set({ notifications: [], unreadReplies: 0, lastComment: null }),
}));

// Text for the notification title, e.g. "Amr Khaled commented on Fix login".
export const commentNotificationTitle = (comment: CommentItem): string => {
  const who = comment.author ? `${comment.author.firstName} ${comment.author.lastName}`.trim() : 'Someone';
  return comment.taskTitle ? `${who} commented on ${comment.taskTitle}` : `${who} commented`;
};
