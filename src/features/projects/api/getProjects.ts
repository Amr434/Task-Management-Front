import apiClient from '@/services/apiClient';
import { Project } from '../types';

export const getProjectsBySpace = async (spaceId: number): Promise<Project[]> => {
  return apiClient.get<any, Project[]>(`/Projects/space/${spaceId}`);
};

export const getProjectById = async (projectId: number): Promise<Project> => {
  return apiClient.get<any, Project>(`/Projects/${projectId}`);
};
