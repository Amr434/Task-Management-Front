import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getTaskActivity } from '@task/core/features/tasks/api';
import { describeActivity } from '@task/core/features/tasks/activity';
import { avatarColor, userDisplayName, userInitials, type TaskActivity } from '@task/core/features/tasks/types';
import { timeAgo } from '@task/core/features/comments/types';
import { en } from '@task/core/i18n/dictionaries/en';
import { useNotificationStore } from '@task/core/store/useNotificationStore';

import { Tile } from '@/components/ui';
import { useTheme } from '@/theme';

// Entries shown before "Show all".
const COLLAPSED_COUNT = 5;

/**
 * Who changed what on a task, newest first. Bump `version` after a save and
 * the list reloads to pick up the new entry.
 */
export function TaskHistory({ taskId, version }: { taskId: number; version: number }) {
  const theme = useTheme();
  const [items, setItems] = useState<TaskActivity[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Someone else changed or commented on this task: reload to show it.
  const liveChange = useNotificationStore((s) => (s.lastTaskChange?.taskId === taskId ? s.lastTaskChange : null));
  const liveComment = useNotificationStore((s) => (s.lastComment?.taskItemId === taskId ? s.lastComment : null));

  useEffect(() => {
    let cancelled = false;
    getTaskActivity(taskId)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setFailed(false);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [taskId, version, liveChange, liveComment]);

  const shown = expanded ? (items ?? []) : (items ?? []).slice(0, COLLAPSED_COUNT);

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{en.history}</Text>

      {items === null && !failed ? (
        <ActivityIndicator style={styles.loading} color={theme.textFaint} />
      ) : failed && !items ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>Could not load the history.</Text>
      ) : shown.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>{en.noHistory}</Text>
      ) : (
        shown.map((a) => (
          <View key={a.id} style={[styles.row, { borderBottomColor: theme.border }]}>
            {a.user ? (
              <Tile text={userInitials(a.user)} color={avatarColor(a.user)} size={26} />
            ) : (
              <View style={{ width: 26 }} />
            )}
            <Text style={[styles.text, { color: theme.textSecondary }]}>
              <Text style={[styles.name, { color: theme.textPrimary }]}>
                {a.user ? userDisplayName(a.user) : 'Someone'}
              </Text>{' '}
              {describeActivity(a, en)}
            </Text>
            <Text style={[styles.time, { color: theme.textFaint }]}>{timeAgo(a.createdAt)}</Text>
          </View>
        ))
      )}

      {items && items.length > COLLAPSED_COUNT ? (
        <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8} style={styles.toggle}>
          <Text style={[styles.toggleText, { color: theme.accent }]}>
            {expanded ? en.historyShowLess : en.historyShowAll.replace('{count}', String(items.length))}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 26 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  loading: { alignSelf: 'flex-start', marginVertical: 12 },
  empty: { fontSize: 13, paddingVertical: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, fontSize: 13, lineHeight: 19 },
  name: { fontWeight: '700' },
  time: { fontSize: 12, marginTop: 2 },
  toggle: { paddingVertical: 12 },
  toggleText: { fontSize: 14, fontWeight: '600' },
});
