import axios from 'axios';
import apiClient from '@/services/apiClient';
import { API_BASE_URL } from '@/services/config';
import { AuthResponse, AuthUser, ChangePasswordRequest, LoginRequest, RegisterUserRequest } from '../types';

// login/refresh use a bare axios instance: they must not go through
// apiClient's interceptors (a 401 there would trigger a refresh loop).
const bare = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

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

// Authenticated endpoints go through apiClient (bearer token attached there).
export const logout = async (refreshToken: string): Promise<void> => {
  return apiClient.post('/Auth/logout', { refreshToken });
};

export const getMe = async (): Promise<AuthUser> => {
  return apiClient.get<AuthUser, AuthUser>('/Auth/me');
};

export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  return apiClient.post('/Auth/change-password', data);
};

// Admin only: creates an account with a temporary password.
export const registerUser = async (data: RegisterUserRequest): Promise<AuthUser> => {
  return apiClient.post<RegisterUserRequest, AuthUser>('/Auth/register', data);
};
