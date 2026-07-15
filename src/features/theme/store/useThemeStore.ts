import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_THEME_COLOR, DEFAULT_THEME_MODE } from '../constants';
import { ThemeColorId, ThemeMode, ThemesByUser, UserThemePreferences } from '../types';
import { applyTheme } from '../utils/applyTheme';
import { themeApi } from '../api';

interface ThemeStoreState {
  mode: ThemeMode;
  color: ThemeColorId;
  userId: number | null;
  themesByUser: ThemesByUser;
  hydrated: boolean;

  loadForUser: (userId: number) => Promise<void>;
  applyPreferences: (mode: ThemeMode, color: ThemeColorId) => Promise<void>;
  resetToDefault: () => void;
  setHydrated: () => void;
}

function cacheKey(userId: number): string {
  return String(userId);
}

function setActiveTheme(
  set: (partial: Partial<ThemeStoreState>) => void,
  userId: number | null,
  prefs: UserThemePreferences,
  themesByUser?: ThemesByUser
) {
  applyTheme(prefs.mode, prefs.color);
  set({
    mode: prefs.mode,
    color: prefs.color,
    userId,
    ...(themesByUser ? { themesByUser } : {}),
  });
}

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set, get) => ({
      mode: DEFAULT_THEME_MODE,
      color: DEFAULT_THEME_COLOR,
      userId: null,
      themesByUser: {},
      hydrated: false,

      loadForUser: async (userId) => {
        const key = cacheKey(userId);
        const cached = get().themesByUser[key];

        if (cached) {
          setActiveTheme(set, userId, cached);
        }

        try {
          const prefs = await themeApi.getMyTheme();
          const themesByUser = { ...get().themesByUser, [key]: prefs };
          setActiveTheme(set, userId, prefs, themesByUser);
        } catch {
          if (!cached) {
            const fallback = { mode: DEFAULT_THEME_MODE, color: DEFAULT_THEME_COLOR };
            setActiveTheme(set, userId, fallback);
          }
        }
      },

      applyPreferences: async (mode, color) => {
        const { userId } = get();
        const prefs = { mode, color };

        if (userId === null) {
          setActiveTheme(set, null, prefs);
          return;
        }

        const key = cacheKey(userId);
        const themesByUser = { ...get().themesByUser, [key]: prefs };
        setActiveTheme(set, userId, prefs, themesByUser);

        try {
          const saved = await themeApi.updateMyTheme(prefs);
          const updated = { ...get().themesByUser, [key]: saved };
          setActiveTheme(set, userId, saved, updated);
        } catch {
          // Local + cache already updated; API will sync on next load.
        }
      },

      resetToDefault: () => {
        const fallback = { mode: DEFAULT_THEME_MODE, color: DEFAULT_THEME_COLOR };
        setActiveTheme(set, null, fallback);
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'theme-storage',
      partialize: (s) => ({ themesByUser: s.themesByUser }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
