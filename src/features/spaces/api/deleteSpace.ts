import apiClient from '@/services/apiClient';

export const deleteSpace = async (id: number): Promise<void> => {
  return apiClient.delete(`/Spaces/${id}`);
};
