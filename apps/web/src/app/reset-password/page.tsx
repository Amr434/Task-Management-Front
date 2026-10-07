"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { resetPassword } from '@task/core/features/auth/api';
import { useI18n } from '@/contexts/I18nContext';
import { AuthCard } from '@/features/auth/components/AuthCard';

// The page the emailed link opens (/reset-password?token=...): the user picks
// a new password. The backend checks the token (one use, expires).
function ResetPasswordForm() {
  const { t } = useI18n();
  const token = useSearchParams().get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // True when the backend refused the link itself (used, expired or wrong):
  // the fix is a new link, so the error offers one.
  const [linkRefused, setLinkRefused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLinkRefused(false);
    if (newPassword.length < 8) {
      setError(t.passwordMin8);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.passwordsDontMatch);
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLinkRefused(true);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="login-form">
        <h2>{t.newPasswordTitle}</h2>
        <div className="login-error" style={{ marginTop: 12 }}>{t.resetLinkMissing}</div>
        <Link className="login-link" href="/forgot-password">{t.requestNewLink}</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="login-form">
        <h2>{t.newPasswordTitle}</h2>
        <div className="login-success">{t.newPasswordDone}</div>
        <Link className="btn-primary login-submit" href="/login">{t.signIn}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>{t.newPasswordTitle}</h2>
      <p className="login-subtitle">{t.newPasswordSubtitle}</p>
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
      {error && (
        <div className="login-error">
          {error}
          {linkRefused && (
            <>
              {' '}
              <Link className="login-link inline" href="/forgot-password">{t.requestNewLink}</Link>
            </>
          )}
        </div>
      )}
      <button className="btn-primary login-submit" type="submit" disabled={busy || !newPassword || !confirmPassword}>
        {busy ? <Loader2 size={16} className="spin" /> : t.newPasswordSave}
      </button>
      <Link className="login-link" href="/login">{t.backToSignIn}</Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard>
      {/* useSearchParams needs a Suspense boundary so the page can be prerendered. */}
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
