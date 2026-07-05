"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getSpaces } from '@/features/spaces/api';
import { Space } from '@/features/spaces/types';
import { useI18n } from '@/contexts/I18nContext';
import { CreateSpaceModal } from './CreateSpaceModal';
import { SpaceIcon } from './SpaceIcon';

export const SpaceList = () => {
  const router = useRouter();
  const { t } = useI18n();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    getSpaces()
      .then(setSpaces)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load spaces'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateSpace = (newSpace: Space) => {
    setSpaces((prev) => [...prev, newSpace]);
    setIsModalOpen(false);
  };

  if (loading) return <div className="space-loading">Loading spaces...</div>;
  if (error) return <div className="empty-state">{error}</div>;

  return (
    <div className="space-grid">
      {spaces.map((space) => (
        <button
          key={space.id}
          className="space-card"
          onClick={() => router.push(`/spaces/${space.id}`)}
        >
          <SpaceIcon icon={space.icon} color={space.color} size={40} />
          <div className="space-card-body">
            <h3 className="space-card-title">{space.name}</h3>
            {space.description && <p className="space-card-desc">{space.description}</p>}
          </div>
        </button>
      ))}

      <button className="space-card space-card-add" onClick={() => setIsModalOpen(true)}>
        <div className="space-card-icon space-card-add-icon">
          <Plus size={18} />
        </div>
        <div className="space-card-body">
          <h3 className="space-card-title">{t.createSpace}</h3>
        </div>
      </button>

      {isModalOpen && (
        <CreateSpaceModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateSpace}
        />
      )}
    </div>
  );
};
