import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useNotificationCenterStore } from '@task/core/features/notifications/store';
import { describeNotification } from '@task/core/features/notifications/describe';
import { NotificationType, type NotificationItem } from '@task/core/features/notifications/types';
import { InvitationTargetType } from '@task/core/features/invitations/types';
import { timeAgo } from '@task/core/features/comments/types';
import { en } from '@task/core/i18n/dictionaries/en';

import { Icon } from '@/components/icon';
import { Avatar, Empty } from '@/components/ui';
import { useTheme } from '@/theme';

/**
 * The saved notification list, like the bell on the web: task changes,
 * comments, @mentions, invitations and due date reminders, kept until read.
 * Opened from the bell on the Home screen. New ones arrive live.
 */
export default function NotificationsScreen() {
  const theme = useTheme();
  const { items, unreadCount, loading, hasMore, refresh, loadMore, markRead, markAllRead } =
    useNotificationCenterStore();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const open = (n: NotificationItem) => {
    markRead(n.id);
    const view = describeNotification(n, en);
    if (view.target.kind === 'task') {
      router.push({
        pathname: '/task/[id]',
        params: { id: String(view.target.taskId), projectId: String(view.target.projectId) },
      });
      return;
    }
    // Invitations: answer them on the Invitations screen, or open what was shared.
    if (n.type === NotificationType.InvitationReceived) {
      router.push('/invitations');
    } else if (n.type === NotificationType.InvitationResponded) {
      const inv = n.payload;
      if (inv.targetType === InvitationTargetType.Project && inv.projectId) {
        router.push({ pathname: '/project/[id]', params: { id: String(inv.projectId), name: inv.targetName } });
      } else if (inv.spaceId) {
        router.push({ pathname: '/space/[id]', params: { id: String(inv.spaceId), name: inv.targetName } });
      }
    }
  };

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
        <Text style={[styles.title, { color: theme.textPrimary }]}>{en.notifications}</Text>
        <Pressable
          onPress={() => router.push('/notification-settings')}
          hitSlop={10}
          accessibilityLabel={en.notificationSettings}
          style={[styles.round, { backgroundColor: theme.bgHover }]}
        >
          <Icon name="settings" size={19} color={theme.textSecondary} />
        </Pressable>
      </View>

      {unreadCount > 0 ? (
        <Pressable onPress={() => markAllRead()} hitSlop={6} style={styles.markAll}>
          <Icon name="checkAll" size={16} color={theme.accent} />
          <Text style={{ color: theme.accent, fontWeight: '600', fontSize: 14 }}>{en.markAllRead}</Text>
        </Pressable>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <Row notification={item} onPress={() => open(item)} />}
        ListEmptyComponent={loading ? null : <Empty text={en.noNotifications} />}
        onEndReached={() => {
          if (hasMore) loadMore();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loading && items.length > 0 ? <ActivityIndicator color={theme.accent} style={{ marginVertical: 12 }} /> : null
        }
        refreshControl={<RefreshControl refreshing={loading && items.length === 0} onRefresh={refresh} tintColor={theme.accent} />}
      />
    </SafeAreaView>
  );
}

function Row({ notification, onPress }: { notification: NotificationItem; onPress: () => void }) {
  const theme = useTheme();
  const view = describeNotification(notification, en);
  const isReminder =
    notification.type === NotificationType.TaskDueSoon || notification.type === NotificationType.TaskOverdue;
  const unread = !notification.isRead;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: theme.border,
          backgroundColor: pressed ? theme.bgHover : unread ? theme.accentMuted : theme.bgSurface,
        },
      ]}
    >
      {view.person ? (
        <Avatar
          firstName={view.person.firstName}
          lastName={view.person.lastName}
          avatarUrl={view.person.avatarUrl}
          color={theme.accent}
          size={34}
        />
      ) : (
        <View style={[styles.iconTile, { backgroundColor: theme.bgHover }]}>
          <Icon
            name={isReminder ? 'alarm' : 'mail'}
            size={18}
            color={notification.type === NotificationType.TaskOverdue ? theme.danger : theme.accent}
          />
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.textPrimary }]} numberOfLines={2}>
          {view.title}
        </Text>
        {view.body ? (
          <Text style={[styles.rowBody, { color: theme.textSecondary }]} numberOfLines={2}>
            {view.body}
          </Text>
        ) : null}
        <Text style={[styles.rowTime, { color: theme.textFaint }]}>{timeAgo(notification.createdAtUtc)}</Text>
      </View>
      {unread ? <View style={[styles.dot, { backgroundColor: theme.accent }]} /> : null}
    </Pressable>
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
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingHorizontal: 18, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 60, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12 },
  iconTile: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  rowBody: { fontSize: 13, lineHeight: 18 },
  rowTime: { fontSize: 12 },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 6 },
});
