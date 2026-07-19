import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { refreshSession } from '@/features/auth/api';

import { API_BASE_URL } from './config';

export { API_BASE_URL };

// True when a request failed because the server never answered (offline,
// refused connection, timeout) as opposed to answering with an error status.
export const isNetworkError = (err: unknown): boolean =>
  err instanceof Error && (err as Error & { isNetworkError?: boolean }).isNetworkError === true;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single in-flight refresh shared by all 401s: the backend rotates refresh
// tokens (one use each), so concurrent requests must not race to refresh.
let refreshPromise: Promise<string> | null = null;

// Exported for callers that bypass axios (e.g. SignalR negotiation) and need
// to refresh an expired access token through the same single-flight gate.
export const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) throw new Error('No refresh token');
      const res = await refreshSession(refreshToken);
      useAuthStore.getState().setSession(res.accessToken, res.refreshToken, res.user, res.mustChangePassword);
      return res.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

apiClient.interceptors.response.use(
  (response) => {
    if (response.status === 204) {
      return {} as any;
    }
    return response.data;
  },
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    // Expired access token: refresh once and replay the request.
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        // Refresh failed (revoked/expired): drop the session; the guard redirects to /login.
        useAuthStore.getState().clearSession();
      }
    }

    // No response at all: the server is unreachable (offline, DNS, CORS, timeout).
    if (!error.response) {
      const netError = new Error("Cannot reach the server. Please check that it is running and try again.");
      (netError as Error & { isNetworkError: boolean }).isNetworkError = true;
      return Promise.reject(netError);
    }

    const errorData = error.response?.data as { message?: string; title?: string } | undefined;
    const message = errorData?.message || errorData?.title || error.message || "An unexpected error occurred";

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
