import apiClient from '@/services/apiClient';
import { CommentItem } from '../types';

export const getTaskComments = async (taskId: number): Promise<CommentItem[]> => {
  return apiClient.get<CommentItem[], CommentItem[]>(`/Tasks/${taskId}/comments`);
};

export const createTaskComment = async (
  taskId: number,
  text: string,
  assignedToId?: number
): Promise<CommentItem> => {
  return apiClient.post<{ text: string; assignedToId?: number }, CommentItem>(
    `/Tasks/${taskId}/comments`,
    { text, assignedToId }
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
