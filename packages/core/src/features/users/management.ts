import { UserRole } from '../auth/types';
import { ManagedUser } from './types';

// Shared user-management helpers for web and mobile. Pure functions only (no
// DOM, no React Native) so both apps render the same rules and labels.
// The backend is the real gate; these only decide what the UI offers.

export const MIN_PASSWORD_LENGTH = 8;

// Only the Super Admin can promote/demote between Member and Admin.
export const canChangeRoles = (role: UserRole | undefined | null): boolean =>
  role === UserRole.SuperAdmin;

// Roles the current user may give to a new account.
export const creatableRoles = (role: UserRole | undefined | null): UserRole[] =>
  role === UserRole.SuperAdmin ? [UserRole.Member, UserRole.Admin] : [UserRole.Member];

export const isValidTemporaryPassword = (password: string): boolean =>
  password.length >= MIN_PASSWORD_LENGTH;

// Labels come from the i18n dictionary so each app can pass its own `t`.
export interface RoleLabels {
  roleMember: string;
  roleAdmin: string;
  roleSuperAdmin: string;
}

export const roleLabel = (role: UserRole, t: RoleLabels): string =>
  role === UserRole.SuperAdmin ? t.roleSuperAdmin : role === UserRole.Admin ? t.roleAdmin : t.roleMember;

export const userFullName = (u: Pick<ManagedUser, 'firstName' | 'lastName'>): string =>
  `${u.firstName} ${u.lastName}`.trim();

export const userInitials = (u: Pick<ManagedUser, 'firstName' | 'lastName'>): string =>
  (u.firstName.charAt(0) + u.lastName.charAt(0)).toUpperCase() || '?';

export const filterUsers = (users: ManagedUser[], query: string): ManagedUser[] => {
  const q = query.trim().toLowerCase();
  if (!q) return users;
  return users.filter(
    (u) => userFullName(u).toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  );
};
