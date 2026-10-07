import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

// The drill-down: spaces -> space -> project -> task. Each screen sets its own
// title from the record it loaded, so headers read as a breadcrumb.
export default function SpacesStackLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bgMain },
        headerTintColor: theme.textPrimary,
        headerTitleStyle: { color: theme.textPrimary },
        contentStyle: { backgroundColor: theme.bgMain },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="space/[id]" options={{ title: 'Space' }} />
      <Stack.Screen name="project/[id]" options={{ title: 'Project' }} />
      <Stack.Screen name="task/new" options={{ title: 'New Task' }} />
      <Stack.Screen name="task/[id]" options={{ title: 'Task' }} />
    </Stack>
  );
}
