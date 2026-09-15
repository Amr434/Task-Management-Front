import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function AppLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Spaces' }} />
    </Stack>
  );
}
