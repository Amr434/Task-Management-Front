// Browser-only half of attachments. Everything platform-agnostic — the types,
// list, upload, delete and size formatting — lives in @task/core and is shared
// with the mobile app; only the download needs the DOM.
export {
  MAX_ATTACHMENT_BYTES,
  deleteAttachment,
  formatFileSize,
  getTaskAttachments,
  uploadAttachment,
  type AttachmentItem,
  type UploadFile,
} from '@task/core/features/attachments/api';

import apiClient from '@task/core/services/apiClient';
import type { AttachmentItem } from '@task/core/features/attachments/api';

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
