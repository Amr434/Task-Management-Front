import apiClient from '@/services/apiClient';
import { Project } from '../types';


export interface CreateProjectDTO {
  name: string;
  description?: string;
  spaceId: number;
}

export const createProject = async (data: CreateProjectDTO): Promise<Project> => {
  return apiClient.post<CreateProjectDTO, Project>('/Projects', data);
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
