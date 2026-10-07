import React, { useEffect, useRef, useState } from 'react';
import { History } from 'lucide-react';
import { getTaskActivity } from '@task/core/features/tasks/api';
import { describeActivity } from '@task/core/features/tasks/activity';
import { TaskActivity, userDisplayName } from '@task/core/features/tasks/types';
import { timeAgo } from '@task/core/features/comments/types';
import { Avatar } from './TaskFieldMenus';
import { useI18n } from '@/contexts/I18nContext';
import { useNotificationStore } from '@task/core/store/useNotificationStore';

// Entries shown before "Show all".
const COLLAPSED_COUNT = 5;

// Edits in the sidebar are optimistic: the request is still in flight when the
// task changes locally. Wait a moment so the reload sees the new entry.
const RELOAD_DELAY_MS = 800;

interface TaskHistoryProps {
  taskId: number;
  // Changes whenever a tracked field of the task changes, to trigger a reload.
  changeKey: string;
}

export const TaskHistory: React.FC<TaskHistoryProps> = ({ taskId, changeKey }) => {
  const { t, language } = useI18n();
  const [items, setItems] = useState<TaskActivity[]>([]);
  const [expanded, setExpanded] = useState(false);
  const loadedFor = useRef<number | null>(null);

  // Someone else changed or commented on this task: reload to show it.
  const liveChange = useNotificationStore((s) => (s.lastTaskChange?.taskId === taskId ? s.lastTaskChange : null));
  const liveComment = useNotificationStore((s) => (s.lastComment?.taskItemId === taskId ? s.lastComment : null));

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getTaskActivity(taskId)
        .then((data) => !cancelled && setItems(data))
        .catch((e) => console.warn('Failed to load task history', e instanceof Error ? e.message : String(e)));

    // A newly opened task loads straight away; later changes wait for the save.
    if (loadedFor.current !== taskId) {
      loadedFor.current = taskId;
      setItems([]);
      setExpanded(false);
      load();
      return () => { cancelled = true; };
    }
    const timer = setTimeout(load, RELOAD_DELAY_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [taskId, changeKey, liveChange, liveComment]);

  const shown = expanded ? items : items.slice(0, COLLAPSED_COUNT);

  return (
    <div className="task-history-section">
      <h3><History size={14} /> {t.history}</h3>

      {items.length === 0 ? (
        <div className="no-comments">{t.noHistory}</div>
      ) : (
        <ul className="task-history-list">
          {shown.map((a) => (
            <li key={a.id} className="task-history-item">
              {a.user ? <Avatar user={a.user} size="sm" /> : null}
              <div className="task-history-text">
                <span className="author-name">{a.user ? userDisplayName(a.user) : '—'}</span>{' '}
                {describeActivity(a, t, language)}
              </div>
              <span className="comment-time" title={new Date(a.createdAt).toLocaleString(language)}>
                {timeAgo(a.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {items.length > COLLAPSED_COUNT && (
        <button className="task-history-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? t.historyShowLess : t.historyShowAll.replace('{count}', String(items.length))}
        </button>
      )}
    </div>
  );
};
