import { create } from 'zustand';
import { HubConnection, HubConnectionBuilder, ILogger, LogLevel } from '@microsoft/signalr';
import { API_BASE_URL } from '@/services/config';
import { refreshAccessToken } from '@/services/apiClient';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Invitation } from '../types';
import { invitationsApi } from '../api';

const HUB_URL = `${API_BASE_URL.replace(/\/api$/, '')}/hubs/invitation`;
const INITIAL_RETRY_MS = 5_000;
const MAX_RETRY_MS = 60_000;

// Backoff state for the connect loop; reset once a connection succeeds.
let retryDelayMs = INITIAL_RETRY_MS;
// A 401 gets one refresh-and-reconnect-immediately pass per outage; further
// 401s fall through to backoff so a misbehaving hub can't cause a tight loop.
let authRetryUsed = false;

// SignalR's built-in logger writes connection failures via console.error,
// which the Next.js dev overlay surfaces as app errors. A down backend is an
// expected condition handled by our retry loop, so route everything to
// console.warn instead.
const signalRLogger: ILogger = {
  log(level: LogLevel, message: string) {
    if (level >= LogLevel.Warning) {
      console.warn(`[SignalR] ${message}`);
    }
  },
};

const isUnauthorized = (err: unknown): boolean => {
  const statusCode = (err as { statusCode?: number } | null)?.statusCode;
  if (statusCode === 401) return true;
  // SignalR wraps negotiation failures in a plain Error; the status only
  // survives in the message ("Status code '401'").
  return /status code '?401'?/i.test(String((err as Error)?.message ?? err));
};

// Retry with exponential backoff (5s → 10s → … → 60s cap) while signed in.
const scheduleReconnect = (get: () => InvitationState) => {
  const delay = retryDelayMs;
  retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_MS);
  setTimeout(() => {
    if (useAuthStore.getState().accessToken) get().connectSignalR();
  }, delay);
};

interface InvitationState {
  pendingInvitations: Invitation[];
  connection: HubConnection | null;
  isLoading: boolean;
  // Bumped when accepting an invitation grants access to new spaces/projects;
  // the Sidebar refetches its lists whenever this changes.
  sidebarVersion: number;

  fetchPending: () => Promise<void>;
  connectSignalR: () => void;
  disconnectSignalR: () => void;
  addInvitation: (invitation: Invitation) => void;
  removeInvitation: (id: number) => void;
  bumpSidebar: () => void;
}


export const useInvitationStore = create<InvitationState>((set, get) => ({
  pendingInvitations: [],
  connection: null,
  isLoading: false,
  sidebarVersion: 0,

  fetchPending: async () => {
    set({ isLoading: true });
    try {
      const invites = await invitationsApi.getPending();
      set({ pendingInvitations: invites });
    } catch (error) {
      // Expected while the API is down; refetched automatically on (re)connect.
      console.warn('Failed to fetch pending invitations:', (error as Error)?.message ?? error);
    } finally {
      set({ isLoading: false });
    }
  },

  connectSignalR: () => {
    if (get().connection) return; // already connected or connecting
    if (!useAuthStore.getState().accessToken) return;

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // Read the token lazily so automatic reconnects pick up rotated tokens.
        accessTokenFactory: () => useAuthStore.getState().accessToken || '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalRLogger)
      .build();

    connection.on('ReceiveInvitation', (invitation: Invitation) => {
      get().addInvitation(invitation);
    });

    connection.on('InvitationResponded', (invitation: Invitation) => {
      console.log('Invitation responded:', invitation);
    });

    connection.onreconnected(() => {
      // Resync anything missed while the transport was down.
      get().fetchPending();
    });

    connection.onclose(() => {
      // withAutomaticReconnect gives up after a few attempts; if this is still
      // the active connection (not a deliberate stop/logout), keep trying.
      if (get().connection !== connection) return;
      set({ connection: null });
      scheduleReconnect(get);
    });

    // Claim the slot before starting so a StrictMode re-mount (or a second
    // component using the store) can't start a duplicate connection.
    set({ connection });

    connection.start().then(
      () => {
        retryDelayMs = INITIAL_RETRY_MS;
        authRetryUsed = false;
        // Refetch in case the initial fetch failed while the API was down.
        get().fetchPending();
      },
      async (err) => {
        // If the slot changed, the failure came from a deliberate stop (logout) — ignore.
        if (get().connection !== connection) return;
        set({ connection: null });

        if (isUnauthorized(err) && !authRetryUsed) {
          // Negotiation bypasses the axios interceptor, so refresh here.
          authRetryUsed = true;
          try {
            await refreshAccessToken();
            get().connectSignalR();
            return;
          } catch {
            // Refresh token revoked/expired: drop the session; the guard
            // redirects to /login and no reconnect is scheduled.
            useAuthStore.getState().clearSession();
            return;
          }
        }

        console.warn(
          `SignalR unavailable, retrying in ${Math.round(retryDelayMs / 1000)}s:`,
          (err as Error)?.message ?? err
        );
        scheduleReconnect(get);
      }
    );
  },

  disconnectSignalR: () => {
    const { connection } = get();
    retryDelayMs = INITIAL_RETRY_MS;
    authRetryUsed = false;
    set({ connection: null, pendingInvitations: [] });
    // stop() aborts an in-flight negotiation; that rejection is handled above.
    connection?.stop().catch(() => {});
  },

  addInvitation: (invitation: Invitation) => {
    set((state) => ({
      pendingInvitations: state.pendingInvitations.some((i) => i.id === invitation.id)
        ? state.pendingInvitations
        : [invitation, ...state.pendingInvitations],
    }));
  },

  removeInvitation: (id: number) => {
    set((state) => ({
      pendingInvitations: state.pendingInvitations.filter((i) => i.id !== id),
    }));
  },

  bumpSidebar: () => set((state) => ({ sidebarVersion: state.sidebarVersion + 1 })),
}));
