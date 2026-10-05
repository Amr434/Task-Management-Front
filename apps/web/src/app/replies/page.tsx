"use client";

import React from 'react';
import { CheckCheck, ChevronRight, MessageSquareReply, RefreshCw } from 'lucide-react';
import { CommentItem, timeAgo } from '@task/core/features/comments/types';
import { useReplies } from '@task/core/features/comments/hooks/useReplies';
import { getTasksByProject } from '@task/core/features/tasks/api';
import { userDisplayName } from '@task/core/features/tasks/types';
import { useSpaceStore } from '@task/core/store/useSpaceStore';
import { Avatar } from '@/features/tasks/components/TaskFieldMenus';
import { useI18n } from '@/contexts/I18nContext';

// Replies: all comments on the tasks assigned to you, newest first. The list comes from the shared useReplies hook (also used by the
// mobile app) and refreshes on its own.
export default function RepliesPage() {
  const { t } = useI18n();
  const setTasksForProject = useSpaceStore((s) => s.setTasksForProject);
  const setDetailTaskId = useSpaceStore((s) => s.setDetailTaskId);
  const { replies, isLoading, error, reload, markRead, markAllRead, unreadCount } = useReplies();

  // Open the task's detail panel. The panel finds tasks via the space store,
  // so load the project's tasks into it first.
  const openTask = async (comment: CommentItem) => {
    if (!comment.projectId || !comment.taskItemId) return;
    // Opening a reply marks its task's comments as read (lowers the badge).
    markRead(comment);
    try {
      const { tasksByProjectId } = useSpaceStore.getState();
      if (!tasksByProjectId[comment.projectId]?.some((task) => task.id === comment.taskItemId)) {
        setTasksForProject(comment.projectId, await getTasksByProject(comment.projectId));
      }
      setDetailTaskId(comment.taskItemId);
    } catch (e) {
      console.warn('Failed to open task', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px' }}>{t.replies}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>{t.repliesSubtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {unreadCount > 0 && (
            <button type="button" className="users-action-btn" onClick={() => markAllRead()} title={t.markAllRead}>
              <CheckCheck size={14} /> {t.markAllRead}
            </button>
          )}
          <button type="button" className="users-action-btn" onClick={() => reload()} title={t.refresh}>
            <RefreshCw size={14} /> {t.refresh}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div style={{ color: 'var(--text-secondary)' }}>{t.loadingComments}</div>
        ) : replies.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-secondary)', gap: '8px' }}>
            <MessageSquareReply size={28} />
            <p style={{ margin: 0 }}>{t.noReplies}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {replies.map((comment) => {
              const crumb = [comment.spaceName, comment.projectName, comment.taskTitle].filter(Boolean).join(' / ');
              const unread = comment.isRead === false;
              return (
                <div key={comment.id} className={`comment-item${unread ? ' reply-unread' : ''}`} style={{ cursor: 'pointer' }} onClick={() => openTask(comment)}>
                  <div className="comment-header">
                    <div className="comment-author-info">
                      {comment.author && (
                        <>
                          <Avatar user={comment.author} size="sm" />
                          <span className="author-name">{userDisplayName(comment.author)}</span>
                        </>
                      )}
                      <span className="comment-time" title={new Date(comment.createdAt).toLocaleString()}>
                        {timeAgo(comment.createdAt)}
                      </span>
                      {unread && <span className="reply-unread-tag">{t.unreadBadgeNew}</span>}
                    </div>
                  </div>
                  <div className="comment-body">
                    <p style={{ margin: 0 }}>{comment.text}</p>
                  </div>
                  {crumb && (
                    <div style={{ marginLeft: '32px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {crumb} <ChevronRight size={12} />
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
