import apiClient from '@/services/apiClient';
import { Project } from '../types';

export const updateProject = async (id: number, data: Partial<Project>): Promise<Project> => {
  return apiClient.put<any, Project>(`/Projects/${id}`, data);
};
