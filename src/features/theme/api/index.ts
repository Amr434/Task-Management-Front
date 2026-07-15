import { DEFAULT_THEME_COLOR, DEFAULT_THEME_MODE } from '../constants';
import { UserThemePreferences } from '../types';

const STORAGE_KEY = 'user-theme-prefs';

export const themeApi = {
  async getMyTheme(): Promise<UserThemePreferences> {
    if (typeof window === 'undefined') {
      return { mode: DEFAULT_THEME_MODE, color: DEFAULT_THEME_COLOR };
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      throw new Error('No theme preferences stored');
    }

    return JSON.parse(raw) as UserThemePreferences;
  },

  async updateMyTheme(prefs: UserThemePreferences): Promise<UserThemePreferences> {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    }
    return prefs;
  },
};
