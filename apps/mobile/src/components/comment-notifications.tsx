import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  commentNotificationTitle,
  notificationTarget,
  useNotificationStore,
  type AppNotification,
} from '@task/core/store/useNotificationStore';
import { describeActivity } from '@task/core/features/tasks/activity';
import { userDisplayName } from '@task/core/features/tasks/types';
import { en } from '@task/core/i18n/dictionaries/en';

import { Icon } from '@/components/icon';
import { Avatar } from '@/components/ui';
import { useTheme } from '@/theme';

const AUTO_HIDE_MS = 6000;

/**
 * Pop-up banners at the top of the screen when someone comments on a task you
 * can see, or changes a task you're assigned to. Fed live by the shared
 * SignalR connection (same as the web). Tap one to open the task.
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

// Who, headline and detail for either kind of notification.
function content(n: AppNotification) {
  if (n.kind === 'comment') {
    return { person: n.comment.author, title: commentNotificationTitle(n.comment), body: n.comment.text };
  }
  const { activity, taskTitle } = n.change;
  const who = activity.user ? userDisplayName(activity.user) : 'Someone';
  return { person: activity.user, title: taskTitle, body: `${who} ${describeActivity(activity, en)}` };
}

function Banner({ notification }: { notification: AppNotification }) {
  const theme = useTheme();
  const dismiss = useNotificationStore((s) => s.dismiss);
  const { person, title, body } = content(notification);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(notification.id), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [notification.id, dismiss]);

  const open = () => {
    dismiss(notification.id);
    const { taskId, projectId } = notificationTarget(notification);
    router.push({
      pathname: '/task/[id]',
      params: { id: String(taskId), projectId: String(projectId) },
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
        firstName={person?.firstName}
        lastName={person?.lastName}
        avatarUrl={person?.avatarUrl}
        color={theme.accent}
        size={30}
      />
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]} numberOfLines={2}>
          {body}
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
