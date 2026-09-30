import { getUnreadRepliesCount, markAllRepliesRead, markCommentRead, markTaskCommentsRead } from './api';
import { useNotificationStore } from '../../store/useNotificationStore';

// Keeps the Replies badge in sync with the backend, shared by web and mobile.
// Every function is best-effort: a failed call just leaves the badge as it is
// until the next refresh.

// Reloads the number on the Replies badge.
export const refreshUnreadReplies = async (): Promise<void> => {
  try {
    useNotificationStore.getState().setUnreadReplies(await getUnreadRepliesCount());
  } catch {
    // Keep the current number; the next poll tries again.
  }
};

// The user opened a task: all of its comments count as read.
export const markTaskRead = async (taskId: number): Promise<void> => {
  try {
    const marked = await markTaskCommentsRead(taskId);
    if (marked > 0) await refreshUnreadReplies();
  } catch {
    // Ignore; the badge refreshes on its own.
  }
};

export const markReplyRead = async (commentId: number): Promise<void> => {
  try {
    const marked = await markCommentRead(commentId);
    if (marked > 0) await refreshUnreadReplies();
  } catch {
    // Ignore; the badge refreshes on its own.
  }
};

export const markAllRead = async (): Promise<void> => {
  // Clear the badge straight away, then confirm with the backend.
  useNotificationStore.getState().setUnreadReplies(0);
  try {
    await markAllRepliesRead();
  } finally {
    await refreshUnreadReplies();
  }
};

// Badge text: "1".."99", then "99+".
export const badgeLabel = (count: number): string => (count > 99 ? '99+' : String(count));
