import apiClient from '@/services/apiClient';
import { CreateDashboardPayload, Dashboard, DashboardSummary } from '../types';

export const getDashboards = async (): Promise<Dashboard[]> => {
  return apiClient.get<any, Dashboard[]>('/Dashboards');
};

export const createDashboard = async (data: CreateDashboardPayload): Promise<Dashboard> => {
  return apiClient.post<any, Dashboard>('/Dashboards', data);
};

export const getDashboardSummary = async (id: number): Promise<DashboardSummary> => {
  return apiClient.get<any, DashboardSummary>(`/Dashboards/${id}/summary`);
};

export const deleteDashboard = async (id: number): Promise<void> => {
  return apiClient.delete(`/Dashboards/${id}`);
};

export const renameDashboard = async (id: number, name: string): Promise<void> => {
  return apiClient.put(`/Dashboards/${id}/name`, { name });
};
