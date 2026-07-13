import apiClient from '@/services/apiClient';
import { CreateInvitationDto, Invitation } from '../types';

export const invitationsApi = {
  getPending: async (): Promise<Invitation[]> => {
    return apiClient.get<never, Invitation[]>('/Invitations/pending');
  },

  create: async (data: CreateInvitationDto): Promise<Invitation> => {
    return apiClient.post<never, Invitation>('/Invitations', data);
  },

  respond: async (id: number, accept: boolean): Promise<Invitation> => {
    return apiClient.post<never, Invitation>(`/Invitations/${id}/respond`, { accept });
  }
};
