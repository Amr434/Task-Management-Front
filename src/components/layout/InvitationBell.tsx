"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, FolderKanban, LayoutGrid } from 'lucide-react';
import { useInvitationStore } from '@/features/invitations/store/useInvitationStore';
import { Invitation, InvitationTargetType } from '@/features/invitations/types';
import { invitationsApi } from '@/features/invitations/api';

export const InvitationBell = () => {
  const router = useRouter();
  const {
    pendingInvitations,
    fetchPending,
    connectSignalR,
    removeInvitation,
    bumpSidebar
  } = useInvitationStore();

  const [open, setOpen] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPending();
    connectSignalR();
    // No cleanup on purpose: the hub connection is a session-wide singleton
    // stopped on logout (Topbar), not on unmount — see useInvitationStore.
  }, [fetchPending, connectSignalR]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const handleRespond = async (inv: Invitation, accept: boolean) => {
    setRespondingId(inv.id);
    try {
      await invitationsApi.respond(inv.id, accept);
      removeInvitation(inv.id);
      if (accept) {
        // Access was just granted: refresh the sidebar lists and take the
        // user straight to what they were invited to.
        bumpSidebar();
        setOpen(false);
        if (inv.targetType === InvitationTargetType.Space && inv.spaceId) {
          router.push(`/spaces/${inv.spaceId}`);
        } else if (inv.projectId) {
          router.push(`/projects/${inv.projectId}${inv.spaceId ? `?spaceId=${inv.spaceId}` : ''}`);
        }
      }
    } catch (error) {
      console.error('Failed to respond to invitation', error);
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="invitation-bell-container" ref={menuRef}>
      <button className="icon-btn" onClick={() => setOpen(!open)} title="Invitations">
        <Bell size={20} />
        {pendingInvitations.length > 0 && (
          <span className="invitation-badge">{pendingInvitations.length}</span>
        )}
      </button>

      {open && (
        <div className="invitation-popover">
          <div className="invitation-popover-title">Invitations</div>
          <div className="invitation-popover-list">
            {pendingInvitations.length === 0 ? (
              <div className="invitation-empty">No pending invitations</div>
            ) : (
              pendingInvitations.map(inv => (
                <div key={inv.id} className="invitation-item">
                  <div className="invitation-item-icon">
                    {inv.targetType === InvitationTargetType.Space
                      ? <LayoutGrid size={16} />
                      : <FolderKanban size={16} />}
                  </div>
                  <div className="invitation-item-body">
                    <div className="invitation-item-text">
                      <strong>{inv.inviterName || 'Someone'}</strong> invited you to the{' '}
                      {inv.targetType === InvitationTargetType.Space ? 'space' : 'project'}{' '}
                      <strong>{inv.targetName}</strong>
                    </div>
                    <div className="invitation-item-actions">
                      <button
                        className="invitation-accept"
                        disabled={respondingId === inv.id}
                        onClick={() => handleRespond(inv, true)}
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button
                        className="invitation-decline"
                        disabled={respondingId === inv.id}
                        onClick={() => handleRespond(inv, false)}
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
