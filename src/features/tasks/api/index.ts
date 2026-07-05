import apiClient from '@/services/apiClient';
import { TaskItem } from '../types';


export interface CreateTaskDTO {
  title: string;
  description?: string;
  listId: number;
  priority?: number;
  order?: number;
  dueDate?: string;
}

export const createTask = async (data: CreateTaskDTO): Promise<TaskItem> => {
  // Assuming the endpoint is POST /Tasks
  return apiClient.post<CreateTaskDTO, TaskItem>('/Tasks', data);
};



export const getTasksByList = async (listId: number): Promise<TaskItem[]> => {
  return apiClient.get<TaskItem[], TaskItem[]>(`/Tasks/list/${listId}`);
};
