import React, { useState } from 'react';
import { LayoutGrid, MoreHorizontal, Share2 } from 'lucide-react';
import { Space } from '../types';
import { InviteMemberModal } from '@/features/invitations/components/InviteMemberModal';
import { InvitationTargetType } from '@/features/invitations/types';
import { useI18n } from '@/contexts/I18nContext';

interface SpaceHeaderProps {
  space: Space | null;
}

export const SpaceHeader: React.FC<SpaceHeaderProps> = ({ space }) => {
  const { t } = useI18n();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  if (!space) return null;

  return (
    <div className="space-header">
      <div className="space-header-top">
        <div className="space-title-container">
          <div className="space-icon" style={{ backgroundColor: space.color || 'var(--accent-color)' }}>
            <LayoutGrid size={16} color="white" />
          </div>
          <h1 className="space-title">{space.name}</h1>
          <button className="icon-btn" style={{marginLeft: '8px'}}><MoreHorizontal size={18} /></button>
        </div>
        <div className="space-header-actions">
          {space.members && space.members.length > 0 && (
            <div className="avatar-group" style={{ display: 'flex', flexDirection: 'row', marginRight: '12px' }}>
              {space.members.slice(0, 4).map((m, i) => (
                <div key={m.id} className="avatar" title={m.name} style={{ backgroundColor: `hsl(${(m.name.length * 50) % 360}, 70%, 60%)`, width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 500, fontSize: '12px', border: '2px solid var(--bg-color)', marginLeft: i > 0 ? '-8px' : '0' }}>{m.initials}</div>
              ))}
            </div>
          )}
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="btn-secondary share-btn" 
            style={{display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px'}}
          >
            <Share2 size={14} /> {t.share}
          </button>
        </div>
      </div>

      {isInviteModalOpen && (
        <InviteMemberModal 
          targetType={InvitationTargetType.Space} 
          targetId={space.id} 
          targetName={space.name}
          onClose={() => setIsInviteModalOpen(false)} 
        />
      )}
    </div>
  );
};
