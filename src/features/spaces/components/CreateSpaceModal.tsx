"use client";
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { createSpace, updateSpace } from '@/features/spaces/api';
import { Space } from '@/features/spaces/types';
import { SPACE_ICONS, SPACE_COLORS } from '@/features/spaces/icons';
import { SpaceIcon } from './SpaceIcon';

interface CreateSpaceModalProps {
  onClose: () => void;
  onSuccess: (space: Space) => void;
  /** When provided, the modal edits this space instead of creating a new one. */
  space?: Space;
}

export const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({ onClose, onSuccess, space }) => {
  const { t } = useI18n();
  const isEdit = !!space;
  const [name, setName] = useState(space?.name ?? '');
  const [description, setDescription] = useState(space?.description ?? '');
  const [color, setColor] = useState(space?.color ?? SPACE_COLORS[0]);
  const [icon, setIcon] = useState<string>(space?.icon ?? SPACE_ICONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload = { name, description, color, icon };
      const savedSpace = isEdit
        ? await updateSpace(space.id, payload)
        : await createSpace(payload);
      onSuccess(savedSpace);
    } catch (err: any) {
      setError(err.message || (isEdit ? 'Failed to update space' : 'Failed to create space'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? t.editSpace : t.createSpace}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          {/* Live preview + name */}
          <div className="space-preview-row">
            <SpaceIcon icon={icon} color={color} size={44} />
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label htmlFor="name">{t.spaceName}</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Marketing, Engineering..."
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this space for?"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Icon</label>
            <div className="icon-picker">
              {SPACE_ICONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  className={`icon-option ${icon === emoji ? 'selected' : ''}`}
                  onClick={() => setIcon(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {SPACE_COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-option ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Saving...' : isEdit ? t.save : t.createSpace}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
