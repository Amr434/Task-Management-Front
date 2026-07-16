"use client";

import React, { useEffect, useState } from 'react';
import { Paperclip, Trash2, Download } from 'lucide-react';
import { AttachmentItem, getTaskAttachments, uploadAttachment, deleteAttachment, downloadAttachment, formatFileSize } from '../api';
import { userDisplayName } from '@/features/tasks/types';
import { useI18n } from '@/contexts/I18nContext';

// Attachment list + upload dropzone for one task (rendered inside the task
// detail sidebar). Files live on the API host, so every project member the
// task is shared with sees the same list.
export const TaskAttachments: React.FC<{ taskId: number }> = ({ taskId }) => {
  const { t } = useI18n();
  const [items, setItems] = useState<AttachmentItem[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setItems([]);
    getTaskAttachments(taskId)
      .then(setItems)
      .catch((e) => console.warn('Failed to load attachments', e instanceof Error ? e.message : String(e)));
  }, [taskId]);

  const handleFiles = async (files: FileList | File[] | null) => {
    const list = files ? Array.from(files) : [];
    if (list.length === 0 || uploading) return;
    setUploading(true);
    try {
      for (const file of list) {
        const created = await uploadAttachment(taskId, file);
        setItems((prev) => [...prev, created]);
      }
    } catch (e) {
      console.warn('Failed to upload attachment', e instanceof Error ? e.message : String(e));
      alert(e instanceof Error ? e.message : t.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachment: AttachmentItem) => {
    try {
      await deleteAttachment(attachment.id);
      setItems((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch (e) {
      console.warn('Failed to delete attachment', e instanceof Error ? e.message : String(e));
    }
  };

  const handleDownload = (attachment: AttachmentItem) => {
    downloadAttachment(attachment).catch((e) =>
      console.warn('Failed to download attachment', e instanceof Error ? e.message : String(e)));
  };

  return (
    <div className="tds-attachments-section">
      <h3>{t.attachments}{items.length > 0 ? ` (${items.length})` : ''}</h3>

      {items.length > 0 && (
        <div className="tds-attachment-list">
          {items.map((a) => (
            <div key={a.id} className="tds-attachment-row" onClick={() => handleDownload(a)} title={t.download}>
              <Paperclip size={14} className="tds-attachment-clip" />
              <span className="tds-attachment-name">{a.fileName}</span>
              <span className="tds-attachment-meta">
                {formatFileSize(a.fileSize)}
                {a.uploadedBy ? ` · ${userDisplayName(a.uploadedBy)}` : ''}
              </span>
              <button
                className="tds-attachment-action"
                title={t.download}
                onClick={(e) => { e.stopPropagation(); handleDownload(a); }}
              >
                <Download size={14} />
              </button>
              <button
                className="tds-attachment-action danger"
                title={t.deleteLabel}
                onClick={(e) => { e.stopPropagation(); handleDelete(a); }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={`tds-attachments-empty ${uploading ? 'uploading' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <div className="tds-attachments-icon"><Paperclip size={20} /></div>
        <div className="tds-attachments-text">
          {uploading ? t.uploading : (<><span className="bold">{t.clickToBrowse}</span> {t.dragDropFiles}</>)}
        </div>
        <input
          type="file"
          multiple
          className="tds-file-input"
          title={t.addAttachment}
          disabled={uploading}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
      </div>
    </div>
  );
};
