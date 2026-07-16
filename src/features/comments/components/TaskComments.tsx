import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, UserPlus, X, Check, Trash2 } from 'lucide-react';
import { CommentItem, timeAgo } from '../types';
import { getTaskComments, createTaskComment, assignComment, resolveComment, reopenComment, unassignComment, deleteComment } from '../api';
import { getProjectMembers } from '@/features/tasks/api';
import { User, userDisplayName } from '@/features/tasks/types';
import { Avatar } from '@/features/tasks/components/TaskFieldMenus';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useI18n } from '@/contexts/I18nContext';

interface TaskCommentsProps {
  taskId: number;
  projectId: number;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, projectId }) => {
  const currentUser = useAuthStore((s) => s.user);
  const { t } = useI18n();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [assignNewTo, setAssignNewTo] = useState<number | null>(null);
  const [showAssignMenuForNew, setShowAssignMenuForNew] = useState(false);
  const [assignMenuForComment, setAssignMenuForComment] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadComments();
    loadMembers();
  }, [taskId, projectId]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setShowAssignMenuForNew(false);
        setAssignMenuForComment(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const loadComments = async () => {
    try {
      const data = await getTaskComments(taskId);
      setComments(data);
    } catch (e) {
      console.error('Failed to load comments', e);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await getProjectMembers(projectId);
      setMembers(data);
    } catch (e) {
      console.error('Failed to load members', e);
    }
  };

  const handlePost = async () => {
    if (!newCommentText.trim()) return;
    try {
      const newComment = await createTaskComment(taskId, newCommentText.trim(), assignNewTo ?? undefined);
      setComments(prev => [...prev, newComment]);
      setNewCommentText('');
      setAssignNewTo(null);
      setShowAssignMenuForNew(false);
    } catch (e) {
      console.error('Failed to post comment', e);
    }
  };

  // Functional updates everywhere: several quick actions in a row must not
  // clobber each other with a stale `comments` closure.
  const applyUpdated = (updated: CommentItem) =>
    setComments(prev => prev.map(c => c.id === updated.id ? updated : c));

  const handleToggleResolve = async (comment: CommentItem) => {
    try {
      const updated = comment.resolvedAt
        ? await reopenComment(comment.id)
        : await resolveComment(comment.id);
      applyUpdated(updated);
    } catch (e) {
      console.error('Failed to toggle resolve', e);
    }
  };

  const handleAssignExisting = async (commentId: number, userId: number) => {
    try {
      applyUpdated(await assignComment(commentId, userId));
      setAssignMenuForComment(null);
    } catch (e) {
      console.error('Failed to assign comment', e);
    }
  };

  const handleUnassignExisting = async (commentId: number) => {
    try {
      applyUpdated(await unassignComment(commentId));
      setAssignMenuForComment(null);
    } catch (e) {
      console.error('Failed to unassign comment', e);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (e) {
      console.error('Failed to delete comment', e);
    }
  };

  return (
    <div className="task-comments-section" ref={rootRef}>
      <h3>{t.activityComments}</h3>
      
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">{t.noActivity}</div>
        ) : (
          comments.map(comment => {
            const isAssigned = !!comment.assignedTo;
            const isResolved = !!comment.resolvedAt;

            return (
              <div key={comment.id} className={`comment-item ${isAssigned ? 'assigned-comment' : ''} ${isResolved ? 'resolved-comment' : ''}`}>
                <div className="comment-header">
                  <div className="comment-author-info">
                    <Avatar user={comment.author!} size="sm" />
                    <span className="author-name">{userDisplayName(comment.author!)}</span>
                    <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                  </div>
                  
                  {isAssigned && (
                    <div className="comment-actions">
                      <button 
                        className={`resolve-btn ${isResolved ? 'is-resolved' : ''}`}
                        onClick={() => handleToggleResolve(comment)}
                        title={isResolved ? t.reopenComment : t.resolveComment}
                      >
                        <Check size={14} strokeWidth={isResolved ? 3 : 2} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="comment-body">
                  <p>{comment.text}</p>
                </div>

                {isAssigned && (
                  <div className="comment-assignment-banner">
                    <div className="assignment-status">
                      <span className="assignment-label">{t.assignedToLabel}</span>
                      <div className="assigned-user-badge" onClick={() => setAssignMenuForComment(comment.id)}>
                        <Avatar user={comment.assignedTo!} size="sm" />
                        <span>{userDisplayName(comment.assignedTo!)}</span>
                      </div>
                      
                      {assignMenuForComment === comment.id && (
                        <div className="popup-anchor bottom-left assignment-menu-popup">
                          <div className="popup-menu">
                            <div className="popup-header">{t.assignTo}</div>
                            <div className="popup-items">
                              <button className="popup-item" onClick={() => handleUnassignExisting(comment.id)}>
                                <X size={14} className="icon-mr" /> {t.unassign}
                              </button>
                              <div className="popup-divider" />
                              {members.map(m => (
                                <button key={m.id} className="popup-item" onClick={() => handleAssignExisting(comment.id, m.id)}>
                                  <Avatar user={m} size="sm" />
                                  <span>{userDisplayName(m)}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {isResolved && comment.resolvedBy && (
                      <div className="resolution-status">
                        {t.resolvedBy} {userDisplayName(comment.resolvedBy)}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Hover actions: assign (when unassigned) + delete own comment */}
                {(!isAssigned || comment.author?.id === currentUser?.id) && (
                  <div className="comment-hover-actions">
                    {!isAssigned && (
                      <button className="hover-action-btn" onClick={() => setAssignMenuForComment(comment.id)} title={t.assignThisComment}>
                        <UserPlus size={14} />
                      </button>
                    )}
                    {comment.author?.id === currentUser?.id && (
                      <button className="hover-action-btn danger" onClick={() => handleDelete(comment.id)} title={t.deleteComment}>
                        <Trash2 size={14} />
                      </button>
                    )}
                    {!isAssigned && assignMenuForComment === comment.id && (
                      <div className="popup-anchor bottom-left assignment-menu-popup">
                        <div className="popup-menu">
                          <div className="popup-header">{t.assignTo}</div>
                          <div className="popup-items">
                            {members.map(m => (
                              <button key={m.id} className="popup-item" onClick={() => handleAssignExisting(comment.id, m.id)}>
                                <Avatar user={m} size="sm" />
                                <span>{userDisplayName(m)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="new-comment-composer">
        <textarea
          value={newCommentText}
          onChange={e => setNewCommentText(e.target.value)}
          placeholder={t.writeComment}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handlePost();
            }
          }}
        />
        <div className="composer-actions">
          <div className="assign-new-container">
            <button 
              className={`assign-new-btn ${assignNewTo ? 'active' : ''}`} 
              onClick={() => setShowAssignMenuForNew(!showAssignMenuForNew)}
              title={t.assignThisComment}
            >
              {assignNewTo && members.some(m => m.id === assignNewTo) ? (
                <>
                  <CheckCircle size={14} className="icon-mr" />
                  {t.assignedToWord} {userDisplayName(members.find(m => m.id === assignNewTo)!)}
                </>
              ) : (
                <>
                  <UserPlus size={14} className="icon-mr" /> {t.assign}
                </>
              )}
            </button>
            {showAssignMenuForNew && (
              <div className="popup-anchor bottom-left">
                <div className="popup-menu">
                  <div className="popup-header">{t.assignTo}</div>
                  <div className="popup-items">
                    {assignNewTo && (
                      <button className="popup-item" onClick={() => { setAssignNewTo(null); setShowAssignMenuForNew(false); }}>
                        <X size={14} className="icon-mr" /> {t.clearAssignment}
                      </button>
                    )}
                    {assignNewTo && <div className="popup-divider" />}
                    {members.map(m => (
                      <button key={m.id} className="popup-item" onClick={() => { setAssignNewTo(m.id); setShowAssignMenuForNew(false); }}>
                        <Avatar user={m} size="sm" />
                        <span>{userDisplayName(m)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <button className="post-comment-btn" onClick={handlePost} disabled={!newCommentText.trim()}>
            {t.commentBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
