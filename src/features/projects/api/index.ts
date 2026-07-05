import apiClient from '@/services/apiClient';
import { Project } from '../types';


export const createProject = async (data: Omit<Project, 'id'>): Promise<Project> => {
  return apiClient.post<any, Project>('/Projects', data);
};



export const deleteProject = async (id: number): Promise<void> => {
  return apiClient.delete(`/Projects/${id}`);
};



export const getProjectsBySpace = async (spaceId: number): Promise<Project[]> => {
  return apiClient.get<any, Project[]>(`/Projects/space/${spaceId}`);
};

export const getProjectById = async (projectId: number): Promise<Project> => {
  return apiClient.get<any, Project>(`/Projects/${projectId}`);
};



export const updateProject = async (id: number, data: Partial<Project>): Promise<Project> => {
  return apiClient.put<any, Project>(`/Projects/${id}`, data);
};
