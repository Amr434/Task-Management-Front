// Mirrors the backend's UserRole enum (serialized as numbers).
export enum UserRole {
  Member = 0,
  Admin = 1,
  // The single seeded account that manages Admins and Members.
  SuperAdmin = 2,
}

// Who may open the user-management screen. The backend enforces the real
// rules; this only decides what the UI shows.
export const canManageUsers = (role: UserRole | undefined | null): boolean =>
  role === UserRole.Admin || role === UserRole.SuperAdmin;

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  // Relative to the API base URL (null = no picture). Build the full URL with avatarSrc().
  avatarUrl?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  mustChangePassword: boolean;
  user: AuthUser;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RegisterUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}
