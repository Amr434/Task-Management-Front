import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/tab-bar';
import { useRealtimeInvitations } from '@/features/invitations/useRealtimeInvitations';
import { useTheme } from '@/theme';

export default function AppLayout() {
  const theme = useTheme();

  // Opened once for the whole signed-in session, and reconnected whenever the
  // app returns to the foreground.
  useRealtimeInvitations();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.bgMain },
      }}
    >
      <Tabs.Screen name="(spaces)" options={{ title: 'Home' }} />
      <Tabs.Screen name="my-tasks" options={{ title: 'My Tasks' }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
