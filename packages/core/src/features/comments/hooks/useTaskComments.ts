import { useCallback, useEffect, useState } from 'react';
import { createTaskComment, getTaskComments } from '../api';
import { CommentItem } from '../types';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { markTaskRead } from '../unread';

const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err));

// A task's comments for web and mobile. Re-fetches every few seconds while
// the task is open, so a comment written in one app shows up in the other
// without reopening the task.
export function useTaskComments(taskId: number | null | undefined, pollMs = 8000) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    // Opening the task marks its comments as read (lowers the Replies badge);
    // so does any new comment that shows up while it's open.
    let knownIds: Set<number> | null = null;
    const load = () =>
      getTaskComments(taskId)
        .then((data) => {
          if (cancelled) return;
          setComments(data);
          setError(null);
          if (knownIds === null || data.some((c) => !knownIds!.has(c.id))) {
            markTaskRead(taskId);
          }
          knownIds = new Set(data.map((c) => c.id));
        })
        .catch((err) => { if (!cancelled) setError(messageOf(err)); })
        .finally(() => { if (!cancelled) setIsLoading(false); });
    load();
    const timer = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [taskId, pollMs]);

  // A live comment on this task arrived: show it right away (no need to wait for the next poll).
  const lastComment = useNotificationStore((st) => st.lastComment);
  const [seenLive, setSeenLive] = useState<CommentItem | null>(null);
  if (lastComment && lastComment !== seenLive) {
    setSeenLive(lastComment);
    if (lastComment.taskItemId === taskId) {
      setComments((prev) => (prev.some((c) => c.id === lastComment.id) ? prev : [...prev, lastComment]));
    }
  }

  // ...and it's seen straight away, so it shouldn't count as unread.
  useEffect(() => {
    if (taskId && lastComment?.taskItemId === taskId) markTaskRead(taskId);
  }, [lastComment, taskId]);

  const reload = useCallback(async () => {
    if (!taskId) return;
    try {
      setComments(await getTaskComments(taskId));
      setError(null);
    } catch (err) {
      setError(messageOf(err));
    }
  }, [taskId]);

  // Posts a comment and appends it straight away. Throws on failure.
  const add = useCallback(
    async (text: string, assignedToId?: number, mentionedUserIds?: number[]) => {
      if (!taskId) throw new Error('No task selected');
      const created = await createTaskComment(taskId, text, assignedToId, mentionedUserIds);
      setComments((prev) => [...prev.filter((c) => c.id !== created.id), created]);
      return created;
    },
    [taskId],
  );

  return { comments, setComments, isLoading, error, reload, add };
}
