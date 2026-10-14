import { create } from 'zustand';
import { notificationsApi, PAGE_SIZE } from './api';
import type { NotificationItem } from './types';

const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err));

// The saved notification list behind the bell, for web and mobile. Loaded
// from the backend; new ones arrive live over SignalR ("NotificationCreated",
// see useInvitationStore), so the list and the badge stay current.
interface NotificationCenterState {
  items: NotificationItem[];
  unreadCount: number;
  // True once the first page was loaded (the list opens instantly after that).
  loaded: boolean;
  loading: boolean;
  // False once a page came back short: there's nothing older to load.
  hasMore: boolean;

  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  add: (item: NotificationItem) => void;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  clear: () => void;
}

export const useNotificationCenterStore = create<NotificationCenterState>((set, get) => ({
  items: [],
  unreadCount: 0,
  loaded: false,
  loading: false,
  hasMore: true,

  // First page plus the unread count (on startup, and after a reconnect).
  refresh: async () => {
    set({ loading: true });
    try {
      const [items, unreadCount] = await Promise.all([notificationsApi.list(), notificationsApi.unreadCount()]);
      set({ items, unreadCount, loaded: true, hasMore: items.length === PAGE_SIZE });
    } catch (err) {
      // Expected while the API is down; refreshed again on reconnect.
      console.warn('Failed to load notifications:', messageOf(err));
    } finally {
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { items, loading, hasMore } = get();
    if (loading || !hasMore || items.length === 0) return;
    set({ loading: true });
    try {
      const older = await notificationsApi.list(items[items.length - 1].id);
      set((s) => ({
        items: [...s.items, ...older.filter((o) => !s.items.some((i) => i.id === o.id))],
        hasMore: older.length === PAGE_SIZE,
      }));
    } catch (err) {
      console.warn('Failed to load older notifications:', messageOf(err));
    } finally {
      set({ loading: false });
    }
  },

  add: (item) =>
    set((s) =>
      s.items.some((i) => i.id === item.id)
        ? s
        : { items: [item, ...s.items], unreadCount: s.unreadCount + (item.isRead ? 0 : 1) },
    ),

  // Optimistic: the dot disappears right away; the server catches up.
  markRead: async (id) => {
    const target = get().items.find((i) => i.id === id);
    if (!target || target.isRead) return;
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, isRead: true } : i)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
    try {
      await notificationsApi.markRead(id);
    } catch (err) {
      console.warn('Failed to mark notification read:', messageOf(err));
    }
  },

  markAllRead: async () => {
    set((s) => ({ items: s.items.map((i) => (i.isRead ? i : { ...i, isRead: true })), unreadCount: 0 }));
    try {
      await notificationsApi.markAllRead();
    } catch (err) {
      console.warn('Failed to mark notifications read:', messageOf(err));
      get().refresh();
    }
  },

  // On logout, so the next user starts clean.
  clear: () => set({ items: [], unreadCount: 0, loaded: false, hasMore: true }),
}));
