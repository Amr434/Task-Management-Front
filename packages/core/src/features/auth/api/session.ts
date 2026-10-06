import axios from 'axios';
import { getApiBaseUrl } from '../../../services/config';
import { AuthResponse, LoginRequest } from '../types';

// Session calls use a bare axios instance rather than apiClient: they must not
// go through its interceptors (a 401 there would trigger a refresh loop), and
// keeping this module free of apiClient lets the auth store and apiClient both
// import it without forming a require cycle.
const bare = axios.create({ headers: { 'Content-Type': 'application/json' } });

// Resolved per request, not at module init: setApiBaseUrl() usually runs after
// this module has already been imported.
bare.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

// Surface the backend's { code, message } error body instead of axios's
// generic "Request failed with status code 401".
bare.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data as { message?: string; title?: string } | undefined;
    return Promise.reject(new Error(data?.message || data?.title || error.message || 'Request failed'));
  }
);

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const res = await bare.post<AuthResponse>('/Auth/login', data);
  return res.data;
};

export const refreshSession = async (refreshToken: string): Promise<AuthResponse> => {
  const res = await bare.post<AuthResponse>('/Auth/refresh', { refreshToken });
  return res.data;
};

// Revokes the refresh token server-side. The caller passes the access token
// because this bypasses apiClient's request interceptor.
export const revokeSession = async (refreshToken: string, accessToken: string | null): Promise<void> => {
  await bare.post(
    '/Auth/logout',
    { refreshToken },
    accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined
  );
};
