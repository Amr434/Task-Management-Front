import { UserRole } from '../auth/types';

// A user as returned by GET /Users/manage.
export interface ManagedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  avatarUrl?: string | null;
  // Whether the current user may manage this one (computed by the backend).
  canManage: boolean;
}
