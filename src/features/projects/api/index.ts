import apiClient from '@/services/apiClient';
import { Project } from '../types';
import { getTasksByProject, createTask } from '@/features/tasks/api';


export interface CreateProjectDTO {
  name: string;
  description?: string;
  spaceId: number;
}

export const createProject = async (data: CreateProjectDTO): Promise<Project> => {
  return apiClient.post<CreateProjectDTO, Project>('/Projects', data);
};


export interface UpdateProjectDTO {
  name: string;
  description?: string;
  spaceId: number;
}

export const updateProject = async (id: number, data: UpdateProjectDTO): Promise<Project> => {
  return apiClient.put<UpdateProjectDTO, Project>(`/Projects/${id}`, data);
};


export const deleteProject = async (id: number): Promise<void> => {
  return apiClient.delete(`/Projects/${id}`);
};


export const getProjectsBySpace = async (spaceId: number): Promise<Project[]> => {
  return apiClient.get<any, Project[]>(`/Projects/space/${spaceId}`);
};


export const getProjectById = async (projectId: number): Promise<Project> => {
  return apiClient.get<any, Project>(`/Projects/${projectId}`);
};


// Deep-copies a project (into the same space) with all of its tasks.
export const duplicateProject = async (project: Project): Promise<Project> => {
  const newProject = await createProject({
    name: `${project.name} (copy)`,
    description: project.description,
    spaceId: project.spaceId,
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

  return newProject;
};
