import apiClient from '../../../services/apiClient';
import { AuthUser, UserRole } from '../../auth/types';
import { ManagedUser } from '../types';
import type { UploadFile } from '../../attachments/api';

export const usersApi = {
  getAll: async (): Promise<AuthUser[]> => {
    return apiClient.get<never, AuthUser[]>('/Users');
  },

  // ---- Profile picture (the signed-in user's own) ----

  uploadAvatar: async (file: UploadFile): Promise<AuthUser> => {
    const form = new FormData();
    // Cast: the DOM and React Native FormData typings disagree, both accept this at runtime.
    form.append('file', file as never);
    return apiClient.post<FormData, AuthUser>('/Users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  removeAvatar: async (): Promise<AuthUser> => {
    return apiClient.delete<never, AuthUser>('/Users/me/avatar');
  },

  // ---- User management (Admin: Members only, Super Admin: Admins + Members) ----

  getManaged: async (): Promise<ManagedUser[]> => {
    return apiClient.get<never, ManagedUser[]>('/Users/manage');
  },

  // Super Admin only. role must be Member or Admin.
  updateRole: async (id: number, role: UserRole): Promise<ManagedUser> => {
    return apiClient.put<{ role: UserRole }, ManagedUser>(`/Users/${id}/role`, { role });
  },

  setStatus: async (id: number, isActive: boolean): Promise<ManagedUser> => {
    return apiClient.put<{ isActive: boolean }, ManagedUser>(`/Users/${id}/status`, { isActive });
  },

  resetPassword: async (id: number, newPassword: string): Promise<ManagedUser> => {
    return apiClient.post<{ newPassword: string }, ManagedUser>(`/Users/${id}/reset-password`, { newPassword });
  },
};
