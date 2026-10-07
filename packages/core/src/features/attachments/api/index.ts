import apiClient from '../../../services/apiClient';
import { User } from '../../tasks/types';

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

/**
 * What each platform hands to FormData for an upload: the browser has a real
 * File, React Native describes the file by uri/name/type. Both are accepted by
 * FormData.append, so the request itself is identical.
 */
export type UploadFile = { uri: string; name: string; type: string } | Blob;

/** The API rejects anything larger; checked before sending to fail fast. */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export const getTaskAttachments = async (taskId: number): Promise<AttachmentItem[]> => {
  return apiClient.get<AttachmentItem[], AttachmentItem[]>(`/Tasks/${taskId}/attachments`);
};

export const uploadAttachment = async (taskId: number, file: UploadFile): Promise<AttachmentItem> => {
  const form = new FormData();
  // Cast because the DOM and React Native typings for FormData disagree on the
  // value type, while both accept exactly these shapes at runtime.
  form.append('file', file as never);
  return apiClient.post<FormData, AttachmentItem>(`/Tasks/${taskId}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteAttachment = async (id: number): Promise<void> => {
  return apiClient.delete(`/Attachments/${id}`);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
