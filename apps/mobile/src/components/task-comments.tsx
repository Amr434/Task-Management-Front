import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTaskComments } from '@task/core/features/comments/hooks/useTaskComments';
import { timeAgo } from '@task/core/features/comments/types';
import { userDisplayName } from '@task/core/features/tasks/types';
import { en } from '@task/core/i18n/dictionaries/en';

import { Icon } from '@/components/icon';
import { Avatar, Chip } from '@/components/ui';
import { useTheme } from '@/theme';

/**
 * A task's comments on mobile: the same list the web shows, oldest to newest,
 * plus a box to write one. Uses the shared useTaskComments hook, which
 * refreshes every few seconds so comments written on the web appear here.
 */
export function TaskComments({ taskId }: { taskId: number }) {
  const theme = useTheme();
  const { comments, isLoading, error, add } = useTaskComments(taskId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await add(trimmed);
      setText('');
    } catch (err) {
      Alert.alert('Could not send comment', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {en.comments}{' '}
        {comments.length ? <Text style={{ color: theme.textSecondary, fontWeight: '500' }}>{comments.length}</Text> : null}
      </Text>

      {isLoading ? (
        <ActivityIndicator color={theme.accent} style={{ marginVertical: 12 }} />
      ) : error && comments.length === 0 ? (
        <Text style={[styles.note, { color: theme.danger }]}>{error}</Text>
      ) : comments.length === 0 ? (
        <Text style={[styles.note, { color: theme.textSecondary }]}>{en.noCommentsYet}</Text>
      ) : (
        comments.map((c) => (
          <View key={c.id} style={[styles.comment, { borderColor: theme.border, backgroundColor: theme.bgCanvas }]}>
            <View style={styles.head}>
              <Avatar
                firstName={c.author?.firstName}
                lastName={c.author?.lastName}
                avatarUrl={c.author?.avatarUrl}
                color={theme.accent}
                size={24}
              />
              <Text style={[styles.author, { color: theme.textPrimary }]} numberOfLines={1}>
                {c.author ? userDisplayName(c.author) : 'Someone'}
              </Text>
              <Text style={[styles.time, { color: theme.textFaint }]}>{timeAgo(c.createdAt)}</Text>
            </View>
            <Text style={[styles.body, { color: theme.textPrimary }]}>{c.text}</Text>
            {c.assignedTo ? (
              <View style={styles.chipRow}>
                <Chip
                  text={`${c.resolvedAt ? 'Resolved' : 'Assigned to'} ${userDisplayName(c.assignedTo)}`}
                  color={c.resolvedAt ? '#2e9e5b' : theme.accent}
                />
              </View>
            ) : null}
          </View>
        ))
      )}

      <View style={[styles.composer, { borderColor: theme.border, backgroundColor: theme.bgSurface }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={en.writeComment}
          placeholderTextColor={theme.textFaint}
          style={[styles.input, { color: theme.textPrimary }]}
          multiline
          editable={!sending}
        />
        <Pressable
          onPress={send}
          disabled={!text.trim() || sending}
          accessibilityLabel={en.send}
          style={({ pressed }) => [
            styles.send,
            { backgroundColor: theme.accent, opacity: !text.trim() || sending ? 0.4 : pressed ? 0.8 : 1 },
          ]}
        >
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="send" size={17} color="#fff" />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 26, gap: 8 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  note: { fontSize: 14 },
  comment: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  author: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  time: { fontSize: 12, marginLeft: 'auto' },
  body: { fontSize: 14, lineHeight: 20 },
  chipRow: { flexDirection: 'row' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    marginTop: 4,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 120, paddingVertical: 6 },
  send: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
