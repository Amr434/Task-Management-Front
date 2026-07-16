"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { X, UserPlus, Search, Check } from 'lucide-react';
import { usersApi } from '@/features/users/api';
import { AuthUser } from '@/features/auth/types';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { invitationsApi } from '../api';
import { InvitationTargetType } from '../types';
import { useI18n } from '@/contexts/I18nContext';

interface InviteMemberModalProps {
  targetType: InvitationTargetType;
  targetId: number;
  targetName: string;
  onClose: () => void;
}

type RowState = { status: 'idle' | 'sending' | 'invited' | 'error'; message?: string };

const AVATAR_COLORS = ['#7b68ee', '#00c875', '#e2445c', '#fdab3d', '#579bfc', '#a25ddc'];

const initialsOf = (u: AuthUser) =>
  `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase() || u.email.charAt(0).toUpperCase();

// ClickUp-style share dialog: type a name/email, matching people appear,
// invite each with one click. Invitees get access after they accept.
export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ targetType, targetId, targetName, onClose }) => {
  const { t } = useI18n();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Record<number, RowState>>({});
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    usersApi.getAll()
      .then(setUsers)
      .catch(() => setLoadError('Failed to load the user list'));
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => u.id !== currentUserId)
      .filter((u) =>
        !q ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
  }, [users, query, currentUserId]);

  const invite = async (user: AuthUser) => {
    setRows((r) => ({ ...r, [user.id]: { status: 'sending' } }));
    try {
      await invitationsApi.create({ targetType, targetId, inviteeUserId: user.id });
      setRows((r) => ({ ...r, [user.id]: { status: 'invited' } }));
    } catch (err) {
      setRows((r) => ({
        ...r,
        [user.id]: { status: 'error', message: err instanceof Error ? err.message : 'Failed to invite' },
      }));
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content share-modal">
        <div className="modal-header">
          <h2><UserPlus size={18} /> Share “{targetName}”</h2>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="share-search">
          <Search size={15} className="share-search-icon" />
          <input
            autoFocus
            placeholder={t.inviteByNameOrEmail}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loadError && <div className="login-error">{loadError}</div>}

        <div className="share-user-list">
          {matches.length === 0 ? (
            <div className="share-empty">No people match “{query}”</div>
          ) : (
            matches.map((u) => {
              const row = rows[u.id] ?? { status: 'idle' };
              return (
                <div key={u.id} className="share-user-row">
                  <span className="share-avatar" style={{ background: AVATAR_COLORS[u.id % AVATAR_COLORS.length] }}>
                    {initialsOf(u)}
                  </span>
                  <div className="share-user-info">
                    <span className="share-user-name">{u.firstName} {u.lastName}</span>
                    <span className="share-user-email">{u.email}</span>
                    {row.status === 'error' && <span className="share-row-error">{row.message}</span>}
                  </div>
                  {row.status === 'invited' ? (
                    <span className="share-invited-chip"><Check size={13} /> Invited</span>
                  ) : (
                    <button
                      className="share-invite-btn"
                      disabled={row.status === 'sending'}
                      onClick={() => invite(u)}
                    >
                      {row.status === 'sending' ? 'Sending…' : t.invite}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="share-footnote">
          People you invite get access to this {targetType === InvitationTargetType.Space ? 'space' : 'project'} once
          they accept the invitation from their inbox (🔔).
        </div>
      </div>
    </div>
  );
};
