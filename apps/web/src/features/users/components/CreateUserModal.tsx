"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RegisterUserRequest, UserRole } from '@task/core/features/auth/types';
import { creatableRoles, isValidTemporaryPassword, roleLabel } from '@task/core/features/users/management';
import { useI18n } from '@/contexts/I18nContext';

interface CreateUserModalProps {
  // Role of the person creating the account: a Super Admin can create Admins
  // and Members, an Admin can create Members only.
  currentRole: UserRole;
  onClose: () => void;
  // Creates the account (the shared useManagedUsers.createUser); throws on failure.
  onSubmit: (data: RegisterUserRequest) => Promise<void>;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ currentRole, onClose, onSubmit }) => {
  const { t } = useI18n();
  const roles = creatableRoles(currentRole);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Member);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canSubmit = firstName.trim() && email.trim() && isValidTemporaryPassword(password) && !isSaving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role: roles.includes(role) ? role : UserRole.Member,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t.addUser}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="users-form-row">
            <div className="form-group">
              <label htmlFor="user-first-name">{t.firstName}</label>
              <input id="user-first-name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus required />
            </div>
            <div className="form-group">
              <label htmlFor="user-last-name">{t.lastName}</label>
              <input id="user-last-name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="user-email">{t.email}</label>
            <input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="user-password">{t.temporaryPassword}</label>
            <input id="user-password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            <span className="users-hint">{t.temporaryPasswordHint}</span>
          </div>

          <div className="form-group">
            <label htmlFor="user-role">{t.roleColumn}</label>
            {roles.length > 1 ? (
              <select id="user-role" className="users-select" value={role} onChange={(e) => setRole(Number(e.target.value) as UserRole)}>
                {roles.map((r) => (
                  <option key={r} value={r}>{roleLabel(r, t)}</option>
                ))}
              </select>
            ) : (
              <span className="users-hint">{t.roleMember} · {t.adminCanCreateMembersOnly}</span>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
              {t.cancel}
            </button>
            <button type="submit" className="btn-primary" disabled={!canSubmit}>
              {isSaving ? t.creating : t.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
