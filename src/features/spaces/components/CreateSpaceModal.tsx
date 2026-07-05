"use client";
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { createSpace } from '@/features/spaces/api';
import { Space } from '@/features/spaces/types';

interface CreateSpaceModalProps {
  onClose: () => void;
  onSuccess: (space: Space) => void;
  workspaceId?: number;
}

const COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3',
  '#FFD133', '#FF33A8', '#8A33FF', '#33FF8A', '#FF8A33'
];

export const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({ onClose, onSuccess, workspaceId = 1 }) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const newSpace = await createSpace({
        name,
        description,
        color,
        workspaceId,
      });
      onSuccess(newSpace);
    } catch (err: any) {
      setError(err.message || 'Failed to create space');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t.createSpace}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
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

          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this space for?"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {COLORS.map(c => (
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
              {isLoading ? 'Creating...' : t.createSpace}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
