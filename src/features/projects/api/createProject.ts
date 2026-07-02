import apiClient from '@/services/apiClient';
import { Project } from '../types';

export const createProject = async (data: Omit<Project, 'id'>): Promise<Project> => {
  return apiClient.post<any, Project>('/Projects', data);
};
