import { useEffect } from 'react';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { refreshUnreadReplies } from '../unread';

// The number on the Replies badge (web sidebar, mobile Home card), like the
// unread count in any messaging app. Loaded when the signed-in user changes
// and every so often after that; live comments bump it straight away
// (useNotificationStore.pushComment) and opening a task lowers it (markTaskRead).
export function useUnreadReplies(pollMs = 30000): number {
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!userId) {
      useNotificationStore.getState().setUnreadReplies(0);
      return;
    }
    refreshUnreadReplies();
    const timer = setInterval(refreshUnreadReplies, pollMs);
    return () => clearInterval(timer);
  }, [userId, pollMs]);

  return useNotificationStore((s) => s.unreadReplies);
}
