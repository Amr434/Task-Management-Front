import apiClient from '@/services/apiClient';
import { Space } from '../types';

export const createSpace = async (data: Omit<Space, 'id'>): Promise<Space> => {
  return apiClient.post<any, Space>('/Spaces', data);
};
