import { apiClient } from '../../lib/api-client';
import type { DashboardSummary, EmployeeDashboard } from './types';

export async function getDashboardSummary() {
  const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
  return response.data;
}

export async function getEmployeeDashboard() {
  const response = await apiClient.get<EmployeeDashboard>('/dashboard/employee');
  return response.data;
}
