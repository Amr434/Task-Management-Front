"use client";

import React, { useMemo, useState } from 'react';
import { KeyRound, Search, ShieldCheck, ShieldOff, UserCheck, UserPlus, UserX } from 'lucide-react';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { UserRole, canManageUsers } from '@task/core/features/auth/types';
import { ManagedUser } from '@task/core/features/users/types';
import { useManagedUsers } from '@task/core/features/users/hooks/useManagedUsers';
import {
  canChangeRoles,
  filterUsers,
  isValidTemporaryPassword,
  roleLabel,
  userFullName,
} from '@task/core/features/users/management';
import { useI18n } from '@/contexts/I18nContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PromptDialog } from '@/components/ui/PromptDialog';
import { CreateUserModal } from '@/features/users/components/CreateUserModal';
import { UserAvatar } from '@/components/ui/UserAvatar';

// User management. Super Admin: Admins + Members. Admin: Members only.
// The list and the actions come from the shared useManagedUsers hook (also used
// by the mobile app); which rows can be managed comes from the backend
// (user.canManage), and the backend re-checks every action.
export default function UsersPage() {
  const { t } = useI18n();
  const currentUser = useAuthStore((s) => s.user);
  const currentRole = currentUser?.role ?? UserRole.Member;
  const allowed = canManageUsers(currentRole);

  const { users, isLoading, error, busy, setStatus, updateRole, resetPassword, createUser } =
    useManagedUsers(allowed);

  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Pending actions (each opens a dialog first).
  const [pendingDeactivate, setPendingDeactivate] = useState<ManagedUser | null>(null);
  const [pendingRole, setPendingRole] = useState<{ user: ManagedUser; role: UserRole } | null>(null);
  const [pendingReset, setPendingReset] = useState<ManagedUser | null>(null);

  const filtered = useMemo(() => filterUsers(users, search), [users, search]);

  // Runs an action, then closes its dialog; shows the backend's message on failure.
  const attempt = async (action: () => Promise<void>, onDone: () => void = () => {}) => {
    try {
      await action();
      onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  if (!allowed) {
    return (
      <main className="main-layout dashboard-page">
        <div className="dashboard-loading">{t.notAllowedToManageUsers}</div>
      </main>
    );
  }

  return (
    <main className="main-layout dashboard-page">
      <header className="dashboard-page-header">
        <div>
          <h1>{t.manageUsers}</h1>
          <p className="users-subtitle">{t.userManagementRules}</p>
        </div>
        <button type="button" className="btn-primary users-add-btn" onClick={() => setIsCreateOpen(true)}>
          <UserPlus size={16} /> {t.addUser}
        </button>
      </header>

      <div className="users-toolbar">
        <div className="dashboard-list-search">
          <Search size={16} />
          <input type="text" placeholder={t.searchUsers} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="dashboard-loading">{t.loadingUsers}</div>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table users-table">
            <thead>
              <tr>
                <th>{t.userColumn}</th>
                <th>{t.roleColumn}</th>
                <th>{t.statusColumn}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="dashboard-table-empty">{t.noUsersFound}</td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className={`users-row ${user.isActive ? '' : 'inactive'}`}>
                    <td>
                      <div className="users-name-cell">
                        <UserAvatar
                          firstName={user.firstName}
                          lastName={user.lastName}
                          avatarUrl={user.avatarUrl}
                          className="dashboard-avatar"
                        />
                        <div>
                          <div className="users-name">
                            {userFullName(user)}
                            {user.id === currentUser?.id && <span className="users-you">{t.you}</span>}
                          </div>
                          <div className="users-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`users-badge role-${user.role}`}>{roleLabel(user.role, t)}</span>
                    </td>
                    <td>
                      <span className={`users-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? t.statusActive : t.statusInactive}
                      </span>
                      {user.mustChangePassword && (
                        <span className="users-badge temp">{t.temporaryPasswordBadge}</span>
                      )}
                    </td>
                    <td>
                      {user.canManage && (
                        <div className="users-actions">
                          {canChangeRoles(currentRole) && (
                            user.role === UserRole.Admin ? (
                              <button type="button" className="users-action-btn" disabled={busy}
                                onClick={() => setPendingRole({ user, role: UserRole.Member })}>
                                <ShieldOff size={14} /> {t.makeMember}
                              </button>
                            ) : (
                              <button type="button" className="users-action-btn" disabled={busy}
                                onClick={() => setPendingRole({ user, role: UserRole.Admin })}>
                                <ShieldCheck size={14} /> {t.makeAdmin}
                              </button>
                            )
                          )}
                          <button type="button" className="users-action-btn" disabled={busy}
                            onClick={() => setPendingReset(user)}>
                            <KeyRound size={14} /> {t.resetPassword}
                          </button>
                          {user.isActive ? (
                            <button type="button" className="users-action-btn danger" disabled={busy}
                              onClick={() => setPendingDeactivate(user)}>
                              <UserX size={14} /> {t.deactivate}
                            </button>
                          ) : (
                            <button type="button" className="users-action-btn" disabled={busy}
                              onClick={() => attempt(() => setStatus(user, true))}>
                              <UserCheck size={14} /> {t.activate}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isCreateOpen && (
        <CreateUserModal
          currentRole={currentRole}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={async (data) => {
            await createUser(data);
            setIsCreateOpen(false);
          }}
        />
      )}

      {pendingDeactivate && (
        <ConfirmDialog
          title={t.deactivateUserTitle}
          message={t.deactivateUserConfirm.replace('{name}', userFullName(pendingDeactivate))}
          confirmLabel={t.deactivate}
          cancelLabel={t.cancel}
          danger
          loading={busy}
          onClose={() => setPendingDeactivate(null)}
          onConfirm={() => attempt(() => setStatus(pendingDeactivate, false), () => setPendingDeactivate(null))}
        />
      )}

      {pendingRole && (
        <ConfirmDialog
          title={t.changeRoleTitle}
          message={t.changeRoleConfirm
            .replace('{name}', userFullName(pendingRole.user))
            .replace('{role}', roleLabel(pendingRole.role, t))}
          confirmLabel={pendingRole.role === UserRole.Admin ? t.makeAdmin : t.makeMember}
          cancelLabel={t.cancel}
          loading={busy}
          onClose={() => setPendingRole(null)}
          onConfirm={() => attempt(() => updateRole(pendingRole.user, pendingRole.role), () => setPendingRole(null))}
        />
      )}

      {pendingReset && (
        <PromptDialog
          title={t.resetPasswordTitle.replace('{name}', userFullName(pendingReset))}
          message={t.resetPasswordMessage.replace('{name}', userFullName(pendingReset))}
          placeholder={t.temporaryPasswordHint}
          confirmLabel={t.resetPassword}
          cancelLabel={t.cancel}
          loading={busy}
          onClose={() => setPendingReset(null)}
          onConfirm={(value) => {
            if (!isValidTemporaryPassword(value)) {
              alert(t.temporaryPasswordHint);
              return;
            }
            attempt(() => resetPassword(pendingReset, value), () => setPendingReset(null));
          }}
        />
      )}
    </main>
  );
}
