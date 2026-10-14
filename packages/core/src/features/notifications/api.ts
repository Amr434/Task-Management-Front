import apiClient from '../../services/apiClient';
import type { NotificationItem, NotificationSettings } from './types';

export const PAGE_SIZE = 20;

export const notificationsApi = {
  // Newest first; pass the last id you have to get the next page.
  list: async (beforeId?: number, take = PAGE_SIZE): Promise<NotificationItem[]> =>
    apiClient.get<NotificationItem[], NotificationItem[]>('/Notifications', { params: { beforeId, take } }),

  unreadCount: async (): Promise<number> => apiClient.get<number, number>('/Notifications/unread-count'),

  markRead: async (id: number): Promise<number> => apiClient.post<{}, number>(`/Notifications/${id}/read`, {}),

  markAllRead: async (): Promise<number> => apiClient.post<{}, number>('/Notifications/read', {}),

  getSettings: async (): Promise<NotificationSettings> =>
    apiClient.get<NotificationSettings, NotificationSettings>('/Notifications/settings'),

  updateSettings: async (settings: NotificationSettings): Promise<NotificationSettings> =>
    apiClient.put<NotificationSettings, NotificationSettings>('/Notifications/settings', settings),
};
