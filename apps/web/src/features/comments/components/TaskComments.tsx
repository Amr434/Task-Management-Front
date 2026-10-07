import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, UserPlus, X, Check, Trash2 } from 'lucide-react';
import { CommentItem, timeAgo } from '@task/core/features/comments/types';
import { createTaskComment, assignComment, resolveComment, reopenComment, unassignComment, deleteComment } from '@task/core/features/comments/api';
import { getProjectMembers } from '@task/core/features/tasks/api';
import { User, userDisplayName } from '@task/core/features/tasks/types';
import { Avatar } from '@/features/tasks/components/TaskFieldMenus';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { useTaskComments } from '@task/core/features/comments/hooks/useTaskComments';
import { useI18n } from '@/contexts/I18nContext';
import {
  findMentionQuery,
  insertMention,
  mentionCandidates,
  mentionedUserIds,
  splitMentions,
  type MentionQuery,
} from '@task/core/features/comments/mentions';

interface TaskCommentsProps {
  taskId: number;
  projectId: number;
  // Called after a change is saved, so the task history can reload.
  onChange?: () => void;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, projectId, onChange }) => {
  const currentUser = useAuthStore((s) => s.user);
  const { t } = useI18n();
  // Shared hook: loads the comments and refreshes them every few seconds, so
  // comments written on the mobile app appear here while the task is open.
  const { comments, setComments } = useTaskComments(taskId);
  const [members, setMembers] = useState<User[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [assignNewTo, setAssignNewTo] = useState<number | null>(null);
  const [showAssignMenuForNew, setShowAssignMenuForNew] = useState(false);
  const [assignMenuForComment, setAssignMenuForComment] = useState<number | null>(null);
  // The "@name" being typed, and which suggestion is highlighted.
  const [mention, setMention] = useState<MentionQuery | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Anyone in the project except yourself can be mentioned.
  const mentionable = members.filter(m => m.id !== currentUser?.id);
  const suggestions = mention ? mentionCandidates(mentionable, mention.query) : [];

  // The project's members: who a comment can be assigned to or mention.
  useEffect(() => {
    let cancelled = false;
    getProjectMembers(projectId)
      .then(data => {
        if (!cancelled) setMembers(data);
      })
      .catch(e => console.error('Failed to load members', e));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

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

  const handlePost = async () => {
    if (!newCommentText.trim()) return;
    try {
      const text = newCommentText.trim();
      const mentioned = mentionedUserIds(text, mentionable);
      const newComment = await createTaskComment(taskId, text, assignNewTo ?? undefined, mentioned.length ? mentioned : undefined);
      setComments(prev => [...prev, newComment]);
      setNewCommentText('');
      setMention(null);
      setAssignNewTo(null);
      setShowAssignMenuForNew(false);
      onChange?.();
    } catch (e) {
      console.error('Failed to post comment', e);
    }
  };

  // Re-check for an "@name" in progress whenever the text or caret moves.
  const updateMention = (text: string, caret: number) => {
    const next = findMentionQuery(text, caret);
    setMention(next);
    if (next?.query !== mention?.query) setMentionIndex(0);
  };

  const pickMention = (user: User) => {
    const el = textareaRef.current;
    if (!mention || !el) return;
    const { text, caret } = insertMention(newCommentText, mention, el.selectionStart, user);
    setNewCommentText(text);
    setMention(null);
    // Put the caret after the inserted name once React has updated the value.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  // Functional updates everywhere: several quick actions in a row must not
  // clobber each other with a stale `comments` closure.
  const applyUpdated = (updated: CommentItem) => {
    setComments(prev => prev.map(c => c.id === updated.id ? updated : c));
    onChange?.();
  };

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
      onChange?.();
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
                  <p>
                    {splitMentions(comment.text, members).map((part, i) =>
                      part.mention ? <span key={i} className="comment-mention">{part.text}</span> : part.text
                    )}
                  </p>
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
        {mention && (
          <div className="mention-menu" role="listbox">
            {suggestions.length === 0 ? (
              <div className="mention-empty">{t.mentionNoMatches}</div>
            ) : (
              suggestions.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  role="option"
                  aria-selected={i === mentionIndex}
                  className={`popup-item${i === mentionIndex ? ' active' : ''}`}
                  // mousedown, not click: keep the textarea focused.
                  onMouseDown={e => {
                    e.preventDefault();
                    pickMention(m);
                  }}
                >
                  <Avatar user={m} size="sm" />
                  <span>{userDisplayName(m)}</span>
                </button>
              ))
            )}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={newCommentText}
          onChange={e => {
            setNewCommentText(e.target.value);
            updateMention(e.target.value, e.target.selectionStart);
          }}
          onClick={e => updateMention(e.currentTarget.value, e.currentTarget.selectionStart)}
          onBlur={() => setMention(null)}
          placeholder={t.writeComment}
          onKeyDown={e => {
            if (mention && suggestions.length > 0) {
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const step = e.key === 'ArrowDown' ? 1 : -1;
                setMentionIndex(i => (i + step + suggestions.length) % suggestions.length);
                return;
              }
              if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                pickMention(suggestions[Math.min(mentionIndex, suggestions.length - 1)]);
                return;
              }
            }
            if (mention && e.key === 'Escape') {
              e.preventDefault();
              setMention(null);
              return;
            }
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
