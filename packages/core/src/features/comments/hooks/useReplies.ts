import { useCallback, useEffect, useState } from 'react';
import { getReplies } from '../api';
import { CommentItem } from '../types';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { markAllRead as markAllReadApi, markTaskRead } from '../unread';

const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err));

// The Replies feed for web and mobile: all comments on the tasks the user is
// assigned to, newest first. Refreshes on its own every so often.
export function useReplies(pollMs = 20000) {
  const [replies, setReplies] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getReplies()
        .then((data) => {
          if (cancelled) return;
          setReplies(data);
          setError(null);
        })
        .catch((err) => { if (!cancelled) setError(messageOf(err)); })
        .finally(() => { if (!cancelled) setIsLoading(false); });
    load();
    const timer = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pollMs]);

  // A live notification arrived: put that comment at the top straight away.
  const lastComment = useNotificationStore((st) => st.lastComment);
  const [seenLive, setSeenLive] = useState<CommentItem | null>(null);
  if (lastComment && lastComment !== seenLive) {
    setSeenLive(lastComment);
    setReplies((prev) => [{ ...lastComment, isRead: false }, ...prev.filter((c) => c.id !== lastComment.id)]);
  }

  const reload = useCallback(async () => {
    try {
      setReplies(await getReplies());
      setError(null);
    } catch (err) {
      setError(messageOf(err));
    }
  }, []);

  // The user opened a reply: its task opens, and every comment on that task
  // counts as read (shown as read here right away, badge updated after).
  const markRead = useCallback((reply: CommentItem) => {
    setReplies((prev) =>
      prev.map((c) => (c.taskItemId === reply.taskItemId && c.isRead === false ? { ...c, isRead: true } : c)),
    );
    markTaskRead(reply.taskItemId);
  }, []);

  const markAllRead = useCallback(async () => {
    setReplies((prev) => prev.map((c) => (c.isRead === false ? { ...c, isRead: true } : c)));
    try {
      await markAllReadApi();
    } catch (err) {
      setError(messageOf(err));
    }
  }, []);

  const unreadCount = replies.filter((c) => c.isRead === false).length;

  return { replies, isLoading, error, reload, markRead, markAllRead, unreadCount };
}
