import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useReplies } from '@task/core/features/comments/hooks/useReplies';
import { timeAgo } from '@task/core/features/comments/types';
import { userDisplayName } from '@task/core/features/tasks/types';
import { en } from '@task/core/i18n/dictionaries/en';

import { Icon } from '@/components/icon';
import { Avatar, Empty, ErrorState, Loading } from '@/components/ui';
import { useTheme } from '@/theme';

/**
 * Replies: all comments on the tasks assigned to you, newest first. Same shared useReplies hook as the web page. Tap one to open its task.
 */
export default function RepliesScreen() {
  const theme = useTheme();
  const { replies, isLoading, error, reload, markRead, markAllRead, unreadCount } = useReplies();

  if (isLoading) return <Loading />;
  if (error && replies.length === 0) return <ErrorState message={error} onRetry={reload} />;

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
        <Text style={[styles.title, { color: theme.textPrimary }]}>{en.replies}</Text>
        {unreadCount > 0 ? (
          <Pressable
            onPress={() => markAllRead()}
            hitSlop={10}
            accessibilityLabel={en.markAllRead}
            style={[styles.round, { backgroundColor: theme.bgHover }]}
          >
            <Icon name="checkAll" size={20} color={theme.accent} />
          </Pressable>
        ) : (
          <View style={styles.round} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={false} onRefresh={reload} tintColor={theme.accent} />}
      >
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{en.repliesSubtitle}</Text>

        {replies.length === 0 ? (
          <Empty text={en.noReplies} />
        ) : (
          replies.map((c) => {
            const crumb = [c.spaceName, c.projectName, c.taskTitle].filter(Boolean).join(' / ');
            const unread = c.isRead === false;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  // Opening a reply marks its task's comments as read (lowers the badge).
                  markRead(c);
                  router.push({
                    pathname: '/task/[id]',
                    params: { id: String(c.taskItemId), projectId: String(c.projectId) },
                  });
                }}
                style={({ pressed }) => [
                  styles.card,
                  { borderColor: theme.border, backgroundColor: pressed ? theme.bgHover : theme.bgSurface },
                  unread && {
                    borderColor: theme.accentBorder,
                    borderLeftColor: theme.accent,
                    borderLeftWidth: 3,
                    backgroundColor: pressed ? theme.bgHover : theme.accentMuted,
                  },
                ]}
              >
                <View style={styles.head}>
                  <Avatar
                    firstName={c.author?.firstName}
                    lastName={c.author?.lastName}
                    avatarUrl={c.author?.avatarUrl}
                    color={theme.accent}
                    size={28}
                  />
                  <Text style={[styles.author, { color: theme.textPrimary }]} numberOfLines={1}>
                    {c.author ? userDisplayName(c.author) : 'Someone'}
                  </Text>
                  <Text style={[styles.time, { color: theme.textFaint }]}>{timeAgo(c.createdAt)}</Text>
                  {unread ? <View style={[styles.dot, { backgroundColor: theme.accent }]} /> : null}
                </View>
                <Text style={[styles.text, { color: theme.textPrimary }, unread && styles.textUnread]}>{c.text}</Text>
                {crumb ? (
                  <View style={styles.crumbRow}>
                    <Text style={[styles.crumb, { color: theme.textSecondary }]} numberOfLines={1}>
                      {crumb}
                    </Text>
                    <Icon name="chevronRight" size={14} color={theme.textFaint} />
                  </View>
                ) : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
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
  body: { padding: 16, paddingBottom: 60, gap: 10 },
  subtitle: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  author: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  time: { fontSize: 12, marginLeft: 'auto' },
  text: { fontSize: 14, lineHeight: 20 },
  textUnread: { fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  crumbRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  crumb: { fontSize: 12, flexShrink: 1 },
});
