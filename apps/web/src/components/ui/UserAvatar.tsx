"use client";

import React from 'react';
import { avatarSrc } from '@task/core/features/users/avatar';

interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  // Existing avatar classes, e.g. "user-avatar", "user-avatar large", "dashboard-avatar".
  className?: string;
}

// The user's profile picture, or their initials when they haven't set one.
export const UserAvatar: React.FC<UserAvatarProps> = ({ firstName = '', lastName = '', avatarUrl, className = 'user-avatar' }) => {
  const src = avatarSrc(avatarUrl);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  return (
    <span className={`${className} avatar-frame`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by our API, not optimisable by next/image
        <img src={src} alt={`${firstName} ${lastName}`.trim()} />
      ) : (
        initials
      )}
    </span>
  );
};
