import apiClient from '@/services/apiClient';
import { TaskItem, Tag, User } from '../types';


export interface CreateTaskDTO {
  title: string;
  description?: string;
  projectId: number;
  status: number;
  priority?: number;
  order?: number;
  dueDate?: string;
  parentTaskId?: number;
}

export const createTask = async (data: CreateTaskDTO): Promise<TaskItem> => {
  // Assuming the endpoint is POST /Tasks
  return apiClient.post<CreateTaskDTO, TaskItem>('/Tasks', data);
};



export const getTasksByProject = async (projectId: number): Promise<TaskItem[]> => {
  return apiClient.get<TaskItem[], TaskItem[]>(`/Tasks/project/${projectId}`);
};


export const deleteTask = async (id: number): Promise<void> => {
  return apiClient.delete(`/Tasks/${id}`);
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


// ---- Tags ----

const TAG_COLORS = ['#e2445c', '#ffb800', '#2684ff', '#00c875', '#7b68ee', '#ff7b72', '#00b4d8'];
const pickTagColor = () => TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];

export const getTags = async (): Promise<Tag[]> => {
  return apiClient.get<Tag[], Tag[]>('/Tags');
};

export const createTag = async (name: string, colorHex: string): Promise<Tag> => {
  return apiClient.post<{ name: string; colorHex: string }, Tag>('/Tags', { name, colorHex });
};

// Attach an existing tag to a task. Backend: POST /Tasks/{taskId}/tags/{tagId}.
export const addTagToTask = async (taskId: number, tagId: number): Promise<void> => {
  return apiClient.post(`/Tasks/${taskId}/tags/${tagId}`, {});
};

// Detach a tag from a task. Backend: DELETE /Tasks/{taskId}/tags/{tagId}.
export const removeTagFromTask = async (taskId: number, tagId: number): Promise<void> => {
  return apiClient.delete(`/Tasks/${taskId}/tags/${tagId}`);
};

// Find a tag by name (case-insensitive, so names stay unique) or create it if missing.
export const findOrCreateTag = async (name: string, existing: Tag[]): Promise<Tag> => {
  const trimmed = name.trim();
  const match = existing.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
  if (match) return match;
  return createTag(trimmed, pickTagColor());
};


// ---- Users / Assignees ----

export const getUsers = async (): Promise<User[]> => {
  return apiClient.get<User[], User[]>('/Users');
};

// Assign a user to a task. Backend: POST /Tasks/{taskId}/assignees/{userId}.
export const assignUserToTask = async (taskId: number, userId: number): Promise<void> => {
  return apiClient.post(`/Tasks/${taskId}/assignees/${userId}`, {});
};

// Unassign a user from a task. Backend: DELETE /Tasks/{taskId}/assignees/{userId}.
export const removeUserFromTask = async (taskId: number, userId: number): Promise<void> => {
  return apiClient.delete(`/Tasks/${taskId}/assignees/${userId}`);
};
