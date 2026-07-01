import apiClient from '@/services/apiClient';
import { TaskItem } from '../types';

export const getTasksByList = async (listId: number): Promise<TaskItem[]> => {
  return apiClient.get<TaskItem[], TaskItem[]>(`/Tasks/list/${listId}`);
};
