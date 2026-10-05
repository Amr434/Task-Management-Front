import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  commentNotificationTitle,
  useNotificationStore,
  type CommentNotification,
} from '@task/core/store/useNotificationStore';

import { Icon } from '@/components/icon';
import { Avatar } from '@/components/ui';
import { useTheme } from '@/theme';

const AUTO_HIDE_MS = 6000;

/**
 * Pop-up banners at the top of the screen when someone comments on a task you
 * can see. Fed live by the shared SignalR connection (same as the web).
 * Tap one to open the task.
 */
export function CommentNotifications() {
  const insets = useSafeAreaInsets();
  const notifications = useNotificationStore((s) => s.notifications);
  if (notifications.length === 0) return null;
  return (
    <View pointerEvents="box-none" style={[styles.stack, { top: insets.top + 6 }]}>
      {notifications.map((n) => (
        <Banner key={n.id} notification={n} />
      ))}
    </View>
  );
}

function Banner({ notification }: { notification: CommentNotification }) {
  const theme = useTheme();
  const dismiss = useNotificationStore((s) => s.dismiss);
  const { comment } = notification;

  useEffect(() => {
    const timer = setTimeout(() => dismiss(notification.id), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [notification.id, dismiss]);

  const open = () => {
    dismiss(notification.id);
    router.push({
      pathname: '/task/[id]',
      params: { id: String(comment.taskItemId), projectId: String(comment.projectId) },
    });
  };

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [
        styles.banner,
        {
          backgroundColor: pressed ? theme.bgHover : theme.bgSurface,
          borderColor: theme.border,
          borderLeftColor: theme.accent,
          shadowColor: theme.shadow,
        },
      ]}
    >
      <Avatar
        firstName={comment.author?.firstName}
        lastName={comment.author?.lastName}
        avatarUrl={comment.author?.avatarUrl}
        color={theme.accent}
        size={30}
      />
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
          {commentNotificationTitle(comment)}
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]} numberOfLines={2}>
          {comment.text}
        </Text>
      </View>
      <Pressable onPress={() => dismiss(notification.id)} hitSlop={10} accessibilityLabel="Dismiss">
        <Icon name="close" size={16} color={theme.textFaint} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { position: 'absolute', left: 12, right: 12, gap: 8, zIndex: 100 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700' },
  body: { fontSize: 13 },
});
