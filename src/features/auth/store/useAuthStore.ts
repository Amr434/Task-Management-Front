import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../types';
import * as authApi from '../api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  mustChangePassword: boolean;
  // true once the persisted state has been rehydrated from localStorage,
  // so the guard doesn't redirect before we know whether a session exists.
  hydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser, mustChangePassword: boolean) => void;
  clearSession: () => void;
  setMustChangePassword: (v: boolean) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      mustChangePassword: false,
      hydrated: false,

      login: async (email, password) => {
        const res = await authApi.login({ email, password });
        set({
          user: res.user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          mustChangePassword: res.mustChangePassword,
        });
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) await authApi.logout(refreshToken);
        } catch {
          // Best-effort revoke; clear the local session regardless.
        }
        get().clearSession();
      },

      setSession: (accessToken, refreshToken, user, mustChangePassword) =>
        set({ accessToken, refreshToken, user, mustChangePassword }),

      clearSession: () =>
        set({ user: null, accessToken: null, refreshToken: null, mustChangePassword: false }),

      setMustChangePassword: (v) => set({ mustChangePassword: v }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        mustChangePassword: s.mustChangePassword,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
