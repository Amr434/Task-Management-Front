import apiClient from '@/services/apiClient';
import { Space } from '../types';


export const createSpace = async (data: Omit<Space, 'id'>): Promise<Space> => {
  return apiClient.post<any, Space>('/Spaces', data);
};



export const deleteSpace = async (id: number): Promise<void> => {
  return apiClient.delete(`/Spaces/${id}`);
};



export const getSpacesByWorkspace = async (workspaceId: number): Promise<Space[]> => {
  return apiClient.get<any, Space[]>(`/Spaces/workspace/${workspaceId}`);
};

export const getSpaces = async (): Promise<Space[]> => {
  return apiClient.get<any, Space[]>('/Spaces');
};
