"use client";

import React, { useRef, useState } from 'react';
import { Trash2, Upload, X } from 'lucide-react';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { useProfilePicture } from '@task/core/features/users/hooks/useProfilePicture';
import { AVATAR_TYPES, validateAvatar } from '@task/core/features/users/avatar';
import { useI18n } from '@/contexts/I18nContext';
import { UserAvatar } from '@/components/ui/UserAvatar';

// Lets the signed-in user upload, change or remove their own profile picture.
export const ProfilePictureModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const { busy, upload, remove } = useProfilePicture();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;
    const problem = validateAvatar(file.type, file.size);
    if (problem) {
      setError(t[problem]);
      return;
    }
    setError(null);
    try {
      await upload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRemove = async () => {
    setError(null);
    try {
      await remove();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t.profilePicture}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="profile-picture-body">
          <UserAvatar
            firstName={user?.firstName}
            lastName={user?.lastName}
            avatarUrl={user?.avatarUrl}
            className="user-avatar profile-picture-preview"
          />
          <span className="users-hint">{t.profilePictureHint}</span>

          <input ref={inputRef} type="file" accept={AVATAR_TYPES.join(',')} hidden onChange={handleFile} />

          <div className="profile-picture-actions">
            <button type="button" className="btn-primary users-add-btn" disabled={busy} onClick={() => inputRef.current?.click()}>
              <Upload size={16} /> {busy ? t.uploading : user?.avatarUrl ? t.changePhoto : t.uploadPhoto}
            </button>
            {user?.avatarUrl && (
              <button type="button" className="btn-secondary users-add-btn" disabled={busy} onClick={handleRemove}>
                <Trash2 size={16} /> {t.removePhoto}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
