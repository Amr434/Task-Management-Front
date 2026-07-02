import apiClient from '@/services/apiClient';
import { Workspace } from '../types';

export const getWorkspaces = async (): Promise<Workspace[]> => {
  return apiClient.get<any, Workspace[]>('/Spaces');
};
