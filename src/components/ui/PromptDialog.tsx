"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PromptDialogProps {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
  title,
  message,
  defaultValue = '',
  placeholder = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onClose,
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content prompt-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {message && <p className="confirm-message">{message}</p>}

        <div className="prompt-input-wrapper" style={{ marginTop: '16px' }}>
          <input
            type="text"
            className="input-field"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </div>

        <div className="modal-actions" style={{ marginTop: '24px' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onConfirm(value)}
            disabled={loading || !value.trim()}
          >
            {loading ? 'Saving...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
