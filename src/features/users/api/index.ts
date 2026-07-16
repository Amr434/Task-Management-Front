import apiClient from '@/services/apiClient';
import { AuthUser } from '@/features/auth/types';

export const usersApi = {
  getAll: async (): Promise<AuthUser[]> => {
    return apiClient.get<never, AuthUser[]>('/Users');
  }
};
