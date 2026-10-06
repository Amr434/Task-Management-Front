import apiClient from '../../../services/apiClient';
import { AuthUser, ChangePasswordRequest, RegisterUserRequest } from '../types';

// Token-free session calls live in ./session so the auth store and apiClient
// can use them without a require cycle through this module.
export { login, refreshSession } from './session';

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
