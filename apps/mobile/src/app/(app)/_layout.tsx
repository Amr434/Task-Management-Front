import { View } from 'react-native';
import { Tabs } from 'expo-router';

import { CommentNotifications } from '@/components/comment-notifications';
import { FloatingTabBar } from '@/components/tab-bar';
import { useRealtimeInvitations } from '@/features/invitations/useRealtimeInvitations';
import { useTheme } from '@/theme';

export default function AppLayout() {
  const theme = useTheme();

  // Opened once for the whole signed-in session, and reconnected whenever the
  // app returns to the foreground.
  useRealtimeInvitations();

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.bgMain },
      }}
    >
      <Tabs.Screen name="(spaces)" options={{ title: 'Home' }} />
      <Tabs.Screen name="my-tasks" options={{ title: 'My Tasks' }} />
      <Tabs.Screen name="replies" options={{ title: 'Replies' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
    {/* Live "new comment" pop-ups, above every tab. */}
    <CommentNotifications />
    </View>
  );
}
