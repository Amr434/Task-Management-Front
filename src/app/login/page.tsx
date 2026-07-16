"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { changePassword } from '@/features/auth/api';
import { useI18n } from '@/contexts/I18nContext';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const login = useAuthStore((s) => s.login);
  const accessToken = useAuthStore((s) => s.accessToken);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const setMustChangePassword = useAuthStore((s) => s.setMustChangePassword);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in (and no forced password change) -> straight to the app.
  useEffect(() => {
    if (hydrated && accessToken && !mustChangePassword) {
      router.replace('/');
    }
  }, [hydrated, accessToken, mustChangePassword, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      // If mustChangePassword, the effect above won't redirect and the
      // change-password step below renders instead.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await changePassword({ currentPassword: password, newPassword });
      setMustChangePassword(false);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password');
    } finally {
      setBusy(false);
    }
  };

  const showChangeStep = Boolean(accessToken && mustChangePassword);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-mark"><KeyRound size={22} /></span>
          <h1>Task Management</h1>
        </div>

        {!showChangeStep ? (
          <form onSubmit={handleLogin} className="login-form">
            <h2>{t.signIn}</h2>
            <p className="login-subtitle">{t.useTeamAccount}</p>
            <label className="login-label" htmlFor="email">{t.email}</label>
            <input
              id="email"
              type="email"
              className="login-input"
              placeholder="you@example.com"
              value={email}
              autoFocus
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="login-label" htmlFor="password">{t.password}</label>
            <input
              id="password"
              type="password"
              className="login-input"
              placeholder={t.yourPassword}
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="login-error">{error}</div>}
            <button className="btn-primary login-submit" type="submit" disabled={busy || !email.trim() || !password}>
              {busy ? <Loader2 size={16} className="spin" /> : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="login-form">
            <h2>{t.setNewPassword}</h2>
            <p className="login-subtitle">Your password was set by an admin — choose your own before continuing.</p>
            <label className="login-label" htmlFor="new-password">{t.newPassword}</label>
            <input
              id="new-password"
              type="password"
              className="login-input"
              placeholder={t.atLeast8}
              value={newPassword}
              autoFocus
              autoComplete="new-password"
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <label className="login-label" htmlFor="confirm-password">{t.confirmNewPassword}</label>
            <input
              id="confirm-password"
              type="password"
              className="login-input"
              placeholder={t.repeatNewPassword}
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <div className="login-error">{error}</div>}
            <button className="btn-primary login-submit" type="submit" disabled={busy || !newPassword || !confirmPassword}>
              {busy ? <Loader2 size={16} className="spin" /> : 'Save and continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
