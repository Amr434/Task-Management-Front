import apiClient from '@/services/apiClient';

export const deleteProject = async (id: number): Promise<void> => {
  return apiClient.delete(`/Projects/${id}`);
};
