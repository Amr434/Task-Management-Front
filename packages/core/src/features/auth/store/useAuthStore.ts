import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { AuthUser } from '../types';
import * as authApi from '../api';

// Where the session is persisted. Left null on web, so the factory below falls
// through to localStorage and behaves exactly as it did before extraction
// (including on the server, where touching localStorage throws and zustand
// then skips persistence).
//
// React Native has no localStorage, so the mobile app must call
// configureAuthStorage() with a SecureStore-backed adapter during startup.
let storageAdapter: StateStorage | null = null;

// Where writes go when nothing real is available: React Native before
// configureAuthStorage() has run, and the server during SSR.
//
// It has to be a working no-op rather than nothing at all. Handing zustand an
// undefined storage makes it warn on every single write ("the given storage is
// currently unavailable"), and there is no session worth keeping at that point
// anyway — on mobile SecureStore takes over and re-reads moments later.
//
// Deliberately not an in-memory map: this module is shared across requests on
// the server, so a Map here would let one request's session be read by the next.
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// Resolved per access, so configureAuthStorage() is picked up without the
// storage having been captured at module init.
const resolveStorage = (): StateStorage => {
  if (storageAdapter) return storageAdapter;
  return typeof localStorage !== 'undefined' ? localStorage : noopStorage;
};

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
  // Replace the signed-in user's details (e.g. after changing the profile picture).
  updateUser: (user: AuthUser) => void;
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

      updateUser: (user) => set({ user }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(resolveStorage),
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

// Point the session at a platform-specific store and reload what it holds.
// The store is created (and its first rehydrate attempted) at module import, so
// callers that swap the adapter afterwards must re-run rehydration — that is
// what this does. Call it once during startup, before the first guarded screen.
export const configureAuthStorage = async (storage: StateStorage): Promise<void> => {
  storageAdapter = storage;
  useAuthStore.persist.setOptions({ storage: createJSONStorage(() => storage) });
  await useAuthStore.persist.rehydrate();
};
