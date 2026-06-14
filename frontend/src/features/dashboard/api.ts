import { apiClient } from '../../lib/api-client';
import type { AdminDashboard, DashboardSummary, EmployeeDashboard, ManagerDashboard } from './types';

export async function getDashboardSummary() {
  const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
  return response.data;
}

export async function getEmployeeDashboard() {
  const response = await apiClient.get<EmployeeDashboard>('/dashboard/employee');
  return response.data;
}

export async function getAdminDashboard() {
  const response = await apiClient.get<AdminDashboard>('/dashboard/admin');
  return response.data;
}

export async function getManagerDashboard() {
  const response = await apiClient.get<ManagerDashboard>('/dashboard/manager');
  return response.data;
}
