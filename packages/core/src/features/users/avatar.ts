import { getApiBaseUrl } from '../../services/config';

// Profile-picture rules shared by web and mobile (the backend enforces them too).
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];

// Full URL for an <img>/<Image>, or null when the user has no picture.
export const avatarSrc = (avatarUrl?: string | null): string | null =>
  avatarUrl ? `${getApiBaseUrl()}/${avatarUrl}` : null;

// Returns an error key for the i18n dictionary, or null if the file is fine.
export const validateAvatar = (type: string, size?: number): 'pictureWrongType' | 'pictureTooLarge' | null => {
  if (!AVATAR_TYPES.includes(type.toLowerCase())) return 'pictureWrongType';
  if (size !== undefined && size > MAX_AVATAR_BYTES) return 'pictureTooLarge';
  return null;
};
