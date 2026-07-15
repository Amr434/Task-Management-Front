"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getSpaces } from '@/features/spaces/api';
import { Space } from '@/features/spaces/types';
import { SpaceIcon } from '@/features/spaces/components/SpaceIcon';
import { createDashboard } from '../api';
import { Dashboard } from '../types';

interface CreateDashboardModalProps {
  onClose: () => void;
  onSuccess: (dashboard: Dashboard) => void;
}

export const CreateDashboardModal: React.FC<CreateDashboardModalProps> = ({ onClose, onSuccess }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceId, setSpaceId] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSpaces()
      .then((data) => {
        setSpaces(data);
        if (data.length > 0) setSpaceId(data[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load spaces'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceId) return;

    setIsLoading(true);
    setError(null);
    try {
      const dashboard = await createDashboard({ spaceId: Number(spaceId) });
      onSuccess(dashboard);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSpace = spaces.find((s) => s.id === spaceId);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content dashboard-create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Dashboard</h2>
          <button className="close-btn" onClick={onClose} type="button"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="space-select">Space</label>
            <div className="dashboard-space-select-row">
              {selectedSpace && (
                <SpaceIcon icon={selectedSpace.icon} color={selectedSpace.color} size={32} />
              )}
              <select
                id="space-select"
                value={spaceId}
                onChange={(e) => setSpaceId(Number(e.target.value))}
                required
              >
                {spaces.length === 0 ? (
                  <option value="">No spaces available</option>
                ) : (
                  spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isLoading || !spaceId}>
              {isLoading ? 'Creating...' : 'Create Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
