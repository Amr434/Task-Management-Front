import apiClient from '../../../services/apiClient';
import { CommentItem } from '../types';

export const getTaskComments = async (taskId: number): Promise<CommentItem[]> => {
  return apiClient.get<CommentItem[], CommentItem[]>(`/Tasks/${taskId}/comments`);
};

// mentionedUserIds: people @mentioned in the text (project members); each
// gets a notification.
export const createTaskComment = async (
  taskId: number,
  text: string,
  assignedToId?: number,
  mentionedUserIds?: number[]
): Promise<CommentItem> => {
  return apiClient.post<{ text: string; assignedToId?: number; mentionedUserIds?: number[] }, CommentItem>(
    `/Tasks/${taskId}/comments`,
    { text, assignedToId, mentionedUserIds }
  );
};

export const assignComment = async (commentId: number, userId: number): Promise<CommentItem> => {
  return apiClient.put<{}, CommentItem>(`/Comments/${commentId}/assignee/${userId}`, {});
};

export const unassignComment = async (commentId: number): Promise<CommentItem> => {
  return apiClient.delete<any, CommentItem>(`/Comments/${commentId}/assignee`);
};

export const resolveComment = async (commentId: number): Promise<CommentItem> => {
  return apiClient.post<{}, CommentItem>(`/Comments/${commentId}/resolve`, {});
};

export const reopenComment = async (commentId: number): Promise<CommentItem> => {
  return apiClient.post<{}, CommentItem>(`/Comments/${commentId}/reopen`, {});
};

export const deleteComment = async (commentId: number): Promise<void> => {
  return apiClient.delete(`/Comments/${commentId}`);
};

// Comments assigned to the current user across all tasks, with
// task/project/space context (the "Assigned Comments" view).
export const getAssignedComments = async (): Promise<CommentItem[]> => {
  return apiClient.get<CommentItem[], CommentItem[]>('/Comments/assigned');
};

// "Replies": all comments on the tasks the current user is assigned to
// (including comments from before they were added), newest first.
export const getReplies = async (): Promise<CommentItem[]> => {
  return apiClient.get<CommentItem[], CommentItem[]>('/Comments/replies');
};

// ---- Unread replies (the badge on Replies) ----

// How many replies the current user hasn't opened yet.
export const getUnreadRepliesCount = async (): Promise<number> => {
  return apiClient.get<number, number>('/Comments/replies/unread-count');
};

// Opening a task marks all of its comments as read.
export const markTaskCommentsRead = async (taskId: number): Promise<number> => {
  return apiClient.post<{}, number>(`/Tasks/${taskId}/comments/read`, {});
};

export const markCommentRead = async (commentId: number): Promise<number> => {
  return apiClient.post<{}, number>(`/Comments/${commentId}/read`, {});
};

export const markAllRepliesRead = async (): Promise<number> => {
  return apiClient.post<{}, number>('/Comments/replies/read', {});
};
