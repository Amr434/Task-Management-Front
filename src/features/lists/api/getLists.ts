import apiClient from '@/services/apiClient';
import { List } from '../types';

export const getListsByProject = async (projectId: number): Promise<List[]> => {
  return apiClient.get<List[], List[]>(`/Lists/project/${projectId}`);
};
