import React from 'react';
import { LayoutGrid, List as ListIcon, Columns, Calendar, Plus, MoreHorizontal, Settings, Share2, Search, Filter } from 'lucide-react';
import { Space } from '../types';

interface SpaceHeaderProps {
  space: Space | null;
}

export const SpaceHeader: React.FC<SpaceHeaderProps> = ({ space }) => {
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
          <div className="avatar-group" style={{marginRight: '12px'}}>
            <div className="avatar" style={{ backgroundColor: '#ff7b72', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 500, fontSize: '12px' }}>A</div>
          </div>
          <button className="btn-secondary share-btn" style={{display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px'}}><Share2 size={14} /> Share</button>
        </div>
      </div>
      
      <div className="space-tabs">
        <button className="space-tab active">
          <ListIcon size={14} />
          List
        </button>
        <button className="space-tab">
          <Columns size={14} />
          Board
        </button>
        <button className="space-tab">
          <Calendar size={14} />
          Calendar
        </button>
        <div style={{width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 8px'}} />
        <button className="space-tab add-tab" style={{color: 'var(--text-secondary)'}}>
          <Plus size={14} />
          View
        </button>
      </div>
    </div>
  );
};
