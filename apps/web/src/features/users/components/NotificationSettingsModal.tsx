"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { notificationsApi } from '@task/core/features/notifications/api';
import {
  EmailDeliveryMode,
  SummaryFrequency,
  type NotificationSettings,
} from '@task/core/features/notifications/types';
import { useI18n } from '@/contexts/I18nContext';

interface NotificationSettingsModalProps {
  onClose: () => void;
}

type EmailSwitch = keyof Pick<
  NotificationSettings,
  | 'emailAssignments'
  | 'emailTaskUpdates'
  | 'emailComments'
  | 'emailMentions'
  | 'emailInvitations'
  | 'emailDueReminders'
>;

// Which emails the current user gets: right away, in a daily digest, or none;
// one switch per kind; and the daily/weekly summary of their tasks.
export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ onClose }) => {
  const { t } = useI18n();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    notificationsApi
      .getSettings()
      .then(setSettings)
      .catch(() => setError(t.settingsSaveFailed));
  }, [t.settingsSaveFailed]);

  const update = (patch: Partial<NotificationSettings>) => setSettings((s) => (s ? { ...s, ...patch } : s));

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      await notificationsApi.updateSettings(settings);
      onClose();
    } catch {
      setError(t.settingsSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const modes: { value: EmailDeliveryMode; label: string; desc: string }[] = [
    { value: EmailDeliveryMode.Instant, label: t.emailInstant, desc: t.emailInstantDesc },
    { value: EmailDeliveryMode.DailyDigest, label: t.emailDigest, desc: t.emailDigestDesc },
    { value: EmailDeliveryMode.Off, label: t.emailOff, desc: t.emailOffDesc },
  ];

  const switches: { key: EmailSwitch; label: string }[] = [
    { key: 'emailAssignments', label: t.emailAssignmentsLabel },
    { key: 'emailTaskUpdates', label: t.emailTaskUpdatesLabel },
    { key: 'emailComments', label: t.emailCommentsLabel },
    { key: 'emailMentions', label: t.emailMentionsLabel },
    { key: 'emailInvitations', label: t.emailInvitationsLabel },
    { key: 'emailDueReminders', label: t.emailDueRemindersLabel },
  ];

  const summaries: { value: SummaryFrequency; label: string }[] = [
    { value: SummaryFrequency.Off, label: t.summaryOff },
    { value: SummaryFrequency.Daily, label: t.summaryDaily },
    { value: SummaryFrequency.Weekly, label: t.summaryWeekly },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content notif-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t.notificationSettings}</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label={t.close}>
            <X size={20} />
          </button>
        </div>

        <p className="notif-settings-note">{t.notifSettingsInApp}</p>

        {!settings ? (
          <div className="notif-settings-loading">{error ?? '…'}</div>
        ) : (
          <>
            <section className="notif-settings-section">
              <h3 className="theme-section-title">{t.emailDelivery}</h3>
              <div className="notif-mode-grid" role="radiogroup" aria-label={t.emailDelivery}>
                {modes.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={settings.emailMode === m.value}
                    className={`notif-mode-card${settings.emailMode === m.value ? ' selected' : ''}`}
                    onClick={() => update({ emailMode: m.value })}
                  >
                    <span className="notif-mode-label">{m.label}</span>
                    <span className="notif-mode-desc">{m.desc}</span>
                  </button>
                ))}
              </div>
            </section>

            <section
              className={`notif-settings-section${settings.emailMode === EmailDeliveryMode.Off ? ' disabled' : ''}`}
            >
              <h3 className="theme-section-title">{t.emailWhich}</h3>
              {switches.map((s) => (
                <label key={s.key} className="notif-switch-row">
                  <input
                    type="checkbox"
                    checked={settings[s.key]}
                    disabled={settings.emailMode === EmailDeliveryMode.Off}
                    onChange={(e) => update({ [s.key]: e.target.checked })}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </section>

            <section className="notif-settings-section">
              <h3 className="theme-section-title">{t.emailSummaryTitle}</h3>
              <p className="notif-settings-hint">{t.emailSummaryDesc}</p>
              <div className="notif-segmented" role="radiogroup" aria-label={t.emailSummaryTitle}>
                {summaries.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    role="radio"
                    aria-checked={settings.emailSummary === s.value}
                    className={settings.emailSummary === s.value ? 'selected' : ''}
                    onClick={() => update({ emailSummary: s.value })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            {error && <div className="notif-settings-error">{error}</div>}
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t.cancel}
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={!settings || saving}>
            {saving ? t.saving : t.save}
          </button>
        </div>
      </div>
    </div>
  );
};
