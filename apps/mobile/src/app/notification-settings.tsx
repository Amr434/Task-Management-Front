import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { notificationsApi } from '@task/core/features/notifications/api';
import {
  EmailDeliveryMode,
  SummaryFrequency,
  type NotificationSettings,
} from '@task/core/features/notifications/types';
import { en } from '@task/core/i18n/dictionaries/en';

import { Icon } from '@/components/icon';
import { ErrorState, Loading, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/theme';

type EmailSwitch =
  | 'emailAssignments'
  | 'emailTaskUpdates'
  | 'emailComments'
  | 'emailMentions'
  | 'emailInvitations'
  | 'emailDueReminders';

const MODES = [
  { value: EmailDeliveryMode.Instant, label: en.emailInstant, desc: en.emailInstantDesc },
  { value: EmailDeliveryMode.DailyDigest, label: en.emailDigest, desc: en.emailDigestDesc },
  { value: EmailDeliveryMode.Off, label: en.emailOff, desc: en.emailOffDesc },
];

const SWITCHES: { key: EmailSwitch; label: string }[] = [
  { key: 'emailAssignments', label: en.emailAssignmentsLabel },
  { key: 'emailTaskUpdates', label: en.emailTaskUpdatesLabel },
  { key: 'emailComments', label: en.emailCommentsLabel },
  { key: 'emailMentions', label: en.emailMentionsLabel },
  { key: 'emailInvitations', label: en.emailInvitationsLabel },
  { key: 'emailDueReminders', label: en.emailDueRemindersLabel },
];

const SUMMARIES = [
  { value: SummaryFrequency.Off, label: en.summaryOff },
  { value: SummaryFrequency.Daily, label: en.summaryDaily },
  { value: SummaryFrequency.Weekly, label: en.summaryWeekly },
];

/**
 * Which emails the user gets (same settings as the web): right away, a daily
 * digest or none; one switch per kind; and the daily/weekly task summary.
 * Opened from Profile and from the notification list.
 */
export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoadError(null);
    notificationsApi
      .getSettings()
      .then(setSettings)
      .catch((err) => setLoadError(err instanceof Error ? err.message : en.settingsSaveFailed));
  };

  useEffect(load, []);

  const update = (patch: Partial<NotificationSettings>) => setSettings((s) => (s ? { ...s, ...patch } : s));

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await notificationsApi.updateSettings(settings);
      router.back();
    } catch (err) {
      Alert.alert(en.settingsSaveFailed, err instanceof Error ? err.message : '');
    } finally {
      setSaving(false);
    }
  };

  const emailOff = settings?.emailMode === EmailDeliveryMode.Off;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bgMain }}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={10}
          accessibilityLabel="Back"
          style={[styles.round, { backgroundColor: theme.bgHover }]}
        >
          <Icon name="back" size={20} color={theme.textSecondary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{en.notificationSettings}</Text>
        <View style={styles.round} />
      </View>

      {loadError ? (
        <ErrorState message={loadError} onRetry={load} />
      ) : !settings ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[styles.note, { color: theme.textSecondary }]}>{en.notifSettingsInApp}</Text>

          <Text style={[styles.section, { color: theme.textSecondary }]}>{en.emailDelivery}</Text>
          <View style={styles.cards}>
            {MODES.map((m) => {
              const selected = settings.emailMode === m.value;
              return (
                <Pressable
                  key={m.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => update({ emailMode: m.value })}
                  style={[
                    styles.card,
                    {
                      borderColor: selected ? theme.accent : theme.border,
                      backgroundColor: selected ? theme.accentMuted : theme.bgSurface,
                    },
                  ]}
                >
                  <View style={styles.cardText}>
                    <Text style={[styles.cardLabel, { color: theme.textPrimary }]}>{m.label}</Text>
                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{m.desc}</Text>
                  </View>
                  {selected ? <Icon name="check" size={18} color={theme.accent} /> : null}
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.section, { color: theme.textSecondary }]}>{en.emailWhich}</Text>
          <View style={{ opacity: emailOff ? 0.5 : 1 }}>
            {SWITCHES.map((s) => (
              <View key={s.key} style={[styles.switchRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.switchLabel, { color: theme.textPrimary }]}>{s.label}</Text>
                <Switch
                  value={settings[s.key]}
                  disabled={emailOff}
                  onValueChange={(value) => update({ [s.key]: value })}
                  trackColor={{ true: theme.accent, false: theme.bgHover }}
                />
              </View>
            ))}
          </View>

          <Text style={[styles.section, { color: theme.textSecondary }]}>{en.emailSummaryTitle}</Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>{en.emailSummaryDesc}</Text>
          <View style={[styles.segmented, { borderColor: theme.border }]}>
            {SUMMARIES.map((s, i) => {
              const selected = settings.emailSummary === s.value;
              return (
                <Pressable
                  key={s.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => update({ emailSummary: s.value })}
                  style={[
                    styles.segment,
                    i > 0 && { borderLeftWidth: 1, borderLeftColor: theme.border },
                    selected && { backgroundColor: theme.accent },
                  ]}
                >
                  <Text style={{ color: selected ? '#fff' : theme.textSecondary, fontWeight: '600', fontSize: 14 }}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 28 }}>
            <PrimaryButton label={en.save} onPress={save} busy={saving} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  round: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  body: { paddingHorizontal: 16, paddingBottom: 60 },
  note: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  section: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: -4, marginBottom: 10 },
  cards: { gap: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  cardText: { flex: 1, gap: 2 },
  cardLabel: { fontSize: 15, fontWeight: '600' },
  cardDesc: { fontSize: 13 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  switchLabel: { flex: 1, fontSize: 15, lineHeight: 20 },
  segmented: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10 },
});
