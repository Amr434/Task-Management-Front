import apiClient from '@/services/apiClient';
import { Space } from '../types';

export const getSpacesByWorkspace = async (workspaceId: number): Promise<Space[]> => {
  return apiClient.get<any, Space[]>(`/Spaces/workspace/${workspaceId}`);
};

export const getSpaces = async (): Promise<Space[]> => {
  return apiClient.get<any, Space[]>('/Spaces');
};
