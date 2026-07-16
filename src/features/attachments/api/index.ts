import apiClient from '@/services/apiClient';
import { User } from '@/features/tasks/types';

// Mirrors backend Task_Management.Application.Features.Attachments.DTOs.AttachmentDto.
// Files are stored on the API host's local disk (offline/LAN-friendly); anyone
// who can open the task can list and download them.
export interface AttachmentItem {
  id: number;
  fileName: string;
  fileSize: number;
  contentType?: string;
  uploadedAt: string;
  taskItemId: number;
  uploadedBy?: User;
}

export const getTaskAttachments = async (taskId: number): Promise<AttachmentItem[]> => {
  return apiClient.get<AttachmentItem[], AttachmentItem[]>(`/Tasks/${taskId}/attachments`);
};

export const uploadAttachment = async (taskId: number, file: File): Promise<AttachmentItem> => {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post<FormData, AttachmentItem>(`/Tasks/${taskId}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteAttachment = async (id: number): Promise<void> => {
  return apiClient.delete(`/Attachments/${id}`);
};

// Downloads via axios so the JWT goes along (a plain <a href> would be
// rejected by the API), then hands the blob to the browser as a file.
export const downloadAttachment = async (attachment: AttachmentItem): Promise<void> => {
  const blob = await apiClient.get<Blob, Blob>(`/Attachments/${attachment.id}/download`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
