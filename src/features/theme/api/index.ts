import { UserThemePreferences } from '../types';

// Theme preferences "API". The backend has no theme endpoints yet, so this
// persists locally with the same async contract the store expects — swap the
// bodies for apiClient calls when a /Users/me/theme endpoint exists.
const STORAGE_KEY = 'theme-preferences';

export const themeApi = {
  async getMyTheme(): Promise<UserThemePreferences> {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) throw new Error('No saved theme');
    return JSON.parse(raw) as UserThemePreferences;
  },

  async updateMyTheme(prefs: UserThemePreferences): Promise<UserThemePreferences> {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    }
    return prefs;
  },
};
