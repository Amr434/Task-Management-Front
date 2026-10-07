"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { requestPasswordReset } from '@task/core/features/auth/api';
import { useI18n } from '@/contexts/I18nContext';
import { AuthCard } from '@/features/auth/components/AuthCard';

// "Forgot password?" from the login page: the user enters their email and the
// backend emails a link to /reset-password. The confirmation is the same
// whether or not the email belongs to an account.
export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard>
      {sent ? (
        <div className="login-form">
          <h2>{t.forgotTitle}</h2>
          <div className="login-success">{t.forgotSent}</div>
          <p className="login-subtitle">{t.forgotCheckSpam}</p>
          <Link className="login-link" href="/login">{t.backToSignIn}</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="login-form">
          <h2>{t.forgotTitle}</h2>
          <p className="login-subtitle">{t.forgotSubtitle}</p>
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
          {error && <div className="login-error">{error}</div>}
          <button className="btn-primary login-submit" type="submit" disabled={busy || !email.trim()}>
            {busy ? <Loader2 size={16} className="spin" /> : t.forgotSend}
          </button>
          <Link className="login-link" href="/login">{t.backToSignIn}</Link>
        </form>
      )}
    </AuthCard>
  );
}
