import apiClient from '@/services/apiClient';
import { TaskItem } from '../types';


export interface CreateTaskDTO {
  title: string;
  description?: string;
  projectId: number;
  status: number;
  priority?: number;
  order?: number;
  dueDate?: string;
}

export const createTask = async (data: CreateTaskDTO): Promise<TaskItem> => {
  // Assuming the endpoint is POST /Tasks
  return apiClient.post<CreateTaskDTO, TaskItem>('/Tasks', data);
};



export const getTasksByProject = async (projectId: number): Promise<TaskItem[]> => {
  return apiClient.get<TaskItem[], TaskItem[]>(`/Tasks/project/${projectId}`);
};


export interface UpdateTaskDTO {
  title: string;
  description?: string;
  dueDate?: string;
  priority: number;
  order: number;
  projectId: number;
  status: number;
  parentTaskId?: number;
}

// PUT /Tasks/{id} — used to move a task between lists (drag & drop) and to edit fields.
export const updateTask = async (id: number, data: UpdateTaskDTO): Promise<TaskItem> => {
  return apiClient.put<UpdateTaskDTO, TaskItem>(`/Tasks/${id}`, data);
};

// Convenience: build the full UpdateTaskDTO from an existing task, applying a patch.
export const patchTask = async (task: TaskItem, patch: Partial<UpdateTaskDTO>): Promise<TaskItem> => {
  return updateTask(task.id, {
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    order: task.order,
    projectId: task.projectId,
    status: task.status,
    parentTaskId: task.parentTaskId,
    ...patch,
  });
};
