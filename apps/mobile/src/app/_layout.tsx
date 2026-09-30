import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';

import { startApp } from '@/services/startup';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useTheme();
  const [ready, setReady] = useState(false);

  const accessToken = useAuthStore((s) => s.accessToken);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);

  // Same rule as the web AuthGuard: a session with a forced password change
  // is not signed in yet — it has to finish that step on the sign-in screen.
  const signedIn = Boolean(accessToken) && !mustChangePassword;

  useEffect(() => {
    // Sets the API base URL and reads any stored session out of the Keychain.
    // Held behind the splash screen so the first frame already knows whether
    // the user is signed in, and we never flash the sign-in screen at someone
    // who is already logged in.
    startApp()
      .catch(() => {
        // A missing or unreadable Keychain entry just means "signed out".
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bgMain },
          headerTintColor: theme.textPrimary,
          contentStyle: { backgroundColor: theme.bgMain },
        }}
      >
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          {/* Above the tabs so the floating tab bar does not cover the writing area. */}
          <Stack.Screen
            name="description"
            options={{ headerShown: false, animation: 'slide_from_bottom' }}
          />
        </Stack.Protected>

        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
