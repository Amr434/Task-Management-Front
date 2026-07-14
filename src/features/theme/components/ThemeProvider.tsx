"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { DEFAULT_THEME_COLOR, DEFAULT_THEME_MODE } from '../constants';
import { useThemeStore } from '../store/useThemeStore';
import { ThemeColorId, ThemeMode } from '../types';
import { applyTheme } from '../utils/applyTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const mode = useThemeStore((s) => s.mode);
  const color = useThemeStore((s) => s.color);
  const loadForUser = useThemeStore((s) => s.loadForUser);
  const resetToDefault = useThemeStore((s) => s.resetToDefault);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedTheme = window.localStorage.getItem('theme-storage');
      if (!storedTheme) return;

      const parsed = JSON.parse(storedTheme) as {
        state?: {
          mode?: ThemeMode;
          color?: ThemeColorId;
          themesByUser?: Record<string, { mode?: ThemeMode; color?: ThemeColorId }>;
        };
      };

      const persistedTheme = parsed.state?.mode && parsed.state?.color
        ? { mode: parsed.state.mode, color: parsed.state.color }
        : Object.values(parsed.state?.themesByUser ?? {})[0];

      if (persistedTheme?.mode && persistedTheme?.color) {
        applyTheme(persistedTheme.mode, persistedTheme.color);
      }
    } catch {
      // Ignore invalid persisted theme data.
    }
  }, []);

  useEffect(() => {
    if (!authHydrated || !themeHydrated) return;

    if (user?.id) {
      void loadForUser(user.id);
    } else {
      resetToDefault();
    }
  }, [authHydrated, themeHydrated, user?.id, loadForUser, resetToDefault]);

  useEffect(() => {
    applyTheme(mode ?? DEFAULT_THEME_MODE, color ?? DEFAULT_THEME_COLOR);
  }, [mode, color]);

  return <>{children}</>;
}
