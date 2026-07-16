import { User } from '@/features/tasks/types';

// Mirrors backend Task_Management.Application.Features.Comments.DTOs.CommentDto
export interface CommentItem {
  id: number;
  text: string;
  createdAt: string;
  author?: User;
  // Present = this is an "assigned comment" (action item, ClickUp-style).
  assignedTo?: User;
  resolvedBy?: User;
  resolvedAt?: string;
  taskItemId: number;
  taskTitle?: string;
  projectId: number;
  projectName?: string;
  spaceName?: string;
}

// Compact relative timestamp for comment rows ("just now", "21m", "3h", "2d",
// falls back to a date for anything older than a week).
export const timeAgo = (iso: string): string => {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
};
