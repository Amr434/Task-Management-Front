"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, MessageSquare } from 'lucide-react';
import { CommentItem, timeAgo } from '@/features/comments/types';
import { getAssignedComments, resolveComment, reopenComment } from '@/features/comments/api';
import { getTasksByProject } from '@/features/tasks/api';
import { userDisplayName } from '@/features/tasks/types';
import { Avatar } from '@/features/tasks/components/TaskFieldMenus';
import { useSpaceStore } from '@/store/useSpaceStore';
import { useI18n } from '@/contexts/I18nContext';

export default function AssignedCommentsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const setTasksForProject = useSpaceStore((s) => s.setTasksForProject);
  const setDetailTaskId = useSpaceStore((s) => s.setDetailTaskId);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'open' | 'resolved'>('open');

  useEffect(() => {
    getAssignedComments()
      .then(setComments)
      .catch((e) => console.warn('Failed to load assigned comments', e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(
    () => comments.filter((c) => (tab === 'open' ? !c.resolvedAt : !!c.resolvedAt)),
    [comments, tab]
  );
  const openCount = useMemo(() => comments.filter((c) => !c.resolvedAt).length, [comments]);

  // Open the task detail sidebar for the comment's task. The sidebar finds
  // tasks via the space store, so load the project's tasks into it first.
  const openTask = async (comment: CommentItem) => {
    if (!comment.projectId || !comment.taskItemId) return;
    try {
      const { tasksByProjectId } = useSpaceStore.getState();
      if (!tasksByProjectId[comment.projectId]?.some((t) => t.id === comment.taskItemId)) {
        const tasks = await getTasksByProject(comment.projectId);
        setTasksForProject(comment.projectId, tasks);
      }
      setDetailTaskId(comment.taskItemId);
    } catch (e) {
      console.warn('Failed to open task', e instanceof Error ? e.message : String(e));
    }
  };

  const toggleResolve = async (comment: CommentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = comment.resolvedAt
        ? await reopenComment(comment.id)
        : await resolveComment(comment.id);
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      console.warn('Failed to toggle resolve', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>{t.assignedComments}</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
          {t.assignedCommentsSubtitle}
        </p>
      </div>

      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
          {(['open', 'resolved'] as const).map((tabKey) => (
            <span
              key={tabKey}
              onClick={() => setTab(tabKey)}
              style={tab === tabKey
                ? { fontWeight: 'bold', color: 'var(--text-primary)', borderBottom: '2px solid var(--text-primary)', paddingBottom: '8px', marginBottom: '-1px', cursor: 'pointer' }
                : { color: 'var(--text-secondary)', paddingBottom: '8px', cursor: 'pointer' }}
            >
              {tabKey === 'open' ? `${t.openTab}${openCount > 0 ? ` (${openCount})` : ''}` : t.resolvedTab}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>{t.loadingComments}</div>
        ) : visible.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-secondary)', gap: '8px' }}>
            <MessageSquare size={28} />
            <p style={{ margin: 0 }}>
              {tab === 'open' ? t.noOpenComments : t.noResolvedComments}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visible.map((comment) => {
              const crumb = [comment.spaceName, comment.projectName, comment.taskTitle].filter(Boolean).join(' / ');
              const resolved = !!comment.resolvedAt;
              return (
                <div
                  key={comment.id}
                  className={`comment-item ${resolved ? 'resolved-comment' : 'assigned-comment'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openTask(comment)}
                >
                  <div className="comment-header">
                    <div className="comment-author-info">
                      {comment.author && (
                        <>
                          <Avatar user={comment.author} size="sm" />
                          <span className="author-name">{userDisplayName(comment.author)}</span>
                        </>
                      )}
                      <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <button
                      className={`resolve-btn ${resolved ? 'is-resolved' : ''}`}
                      onClick={(e) => toggleResolve(comment, e)}
                      title={resolved ? t.reopenComment : t.resolveComment}
                    >
                      <Check size={14} strokeWidth={resolved ? 3 : 2} />
                    </button>
                  </div>

                  <div className="comment-body">
                    <p style={{ margin: 0 }}>{comment.text}</p>
                  </div>

                  {crumb && (
                    <div
                      style={{ marginLeft: '32px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '12px' }}
                      title={t.goToProject}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (comment.projectId) router.push(`/projects/${comment.projectId}`);
                      }}
                    >
                      {crumb} <ChevronRight size={12} />
                    </div>
                  )}

                  {resolved && comment.resolvedBy && (
                    <div className="resolution-status" style={{ marginLeft: '32px' }}>
                      {t.resolvedBy} {userDisplayName(comment.resolvedBy)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
