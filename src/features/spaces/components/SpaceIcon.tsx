import React from 'react';
import { Users } from 'lucide-react';

interface SpaceIconProps {
  icon?: string;
  color?: string;
  size?: number;
  className?: string;
}

// Renders a Space's icon: the chosen emoji, or a Users glyph fallback,
// on a rounded coloured tile.
export const SpaceIcon: React.FC<SpaceIconProps> = ({ icon, color, size = 22, className = '' }) => {
  return (
    <div
      className={`space-icon-tile ${className}`}
      style={{
        backgroundColor: color || 'var(--accent-color)',
        width: size,
        height: size,
        fontSize: Math.round(size * 0.62),
      }}
    >
      {icon ? <span className="space-icon-emoji">{icon}</span> : <Users size={Math.round(size * 0.62)} color="white" />}
    </div>
  );
};
