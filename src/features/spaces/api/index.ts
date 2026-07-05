import apiClient from '@/services/apiClient';
import { Space } from '../types';
import { getProjectsBySpace, createProject } from '@/features/projects/api';
import { getTasksByProject, createTask } from '@/features/tasks/api';


export const createSpace = async (data: Omit<Space, 'id'>): Promise<Space> => {
  return apiClient.post<any, Space>('/Spaces', data);
};



export const updateSpace = async (id: number, data: Omit<Space, 'id'>): Promise<Space> => {
  return apiClient.put<any, Space>(`/Spaces/${id}`, data);
};



export const deleteSpace = async (id: number): Promise<void> => {
  return apiClient.delete(`/Spaces/${id}`);
};



export const getSpaces = async (): Promise<Space[]> => {
  return apiClient.get<any, Space[]>('/Spaces');
};



// Deep-copies a space client-side (no dedicated backend endpoint yet):
// new space -> its projects -> each project's tasks.
export const duplicateSpace = async (space: Space): Promise<Space> => {
  const newSpace = await createSpace({
    name: `${space.name} (copy)`,
    description: space.description,
    color: space.color,
    icon: space.icon,
  });

  const projects = await getProjectsBySpace(space.id);
  for (const project of projects) {
    const newProject = await createProject({
      name: project.name,
      description: project.description,
      spaceId: newSpace.id,
    });

    const tasks = await getTasksByProject(project.id);
    for (const task of tasks) {
      await createTask({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        order: task.order,
        status: task.status,
        projectId: newProject.id,
      });
    }
  }

  return newSpace;
};
