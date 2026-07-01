import apiClient from '@/services/apiClient';
import { Project } from '../types';

export const getProjectsByWorkspace = async (workspaceId: number): Promise<Project[]> => {
  return apiClient.get<Project[], Project[]>(`/Projects/workspace/${workspaceId}`);
};
