import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { useInvitationStore } from '@task/core/features/invitations/store/useInvitationStore';
import { useNotificationCenterStore } from '@task/core/features/notifications/store';

/**
 * Keeps the shared SignalR connection alive for the mobile lifecycle.
 *
 * The store treats the hub as a per-login singleton and must never be stopped
 * in component cleanup — doing so aborts an in-flight negotiation. So this only
 * connects, and only disconnects when the session actually ends.
 *
 * The mobile-specific part is backgrounding: the OS tears down sockets once the
 * app leaves the screen, and the hub comes back dead. On return to the
 * foreground we reconnect (a no-op if the socket survived) and refetch, so
 * anything that arrived while away is not missed.
 */
export function useRealtimeInvitations() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const connectSignalR = useInvitationStore((s) => s.connectSignalR);
  const disconnectSignalR = useInvitationStore((s) => s.disconnectSignalR);
  const fetchPending = useInvitationStore((s) => s.fetchPending);

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!accessToken) {
      disconnectSignalR();
      return;
    }
    connectSignalR();
    fetchPending();
  }, [accessToken, connectSignalR, disconnectSignalR, fetchPending]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const returning = appState.current.match(/inactive|background/) && next === 'active';
      appState.current = next;
      if (!returning || !useAuthStore.getState().accessToken) return;

      connectSignalR();
      fetchPending();
      // The notification list and its badge may have missed live updates too.
      useNotificationCenterStore.getState().refresh();
    });
    return () => sub.remove();
  }, [connectSignalR, fetchPending]);
}
