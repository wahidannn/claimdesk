import { apiClient } from '../../lib/api-client';
import type { PagedResponse } from '../../lib/api-types';
import type { Department, DepartmentListParams, DepartmentRequest } from './types';

export async function listDepartments(params: DepartmentListParams = {}) {
  const response = await apiClient.get<PagedResponse<Department>>('/admin/departments', { params });
  return response.data;
}

export async function createDepartment(request: DepartmentRequest) {
  const response = await apiClient.post<Department>('/admin/departments', request);
  return response.data;
}

export async function updateDepartment(id: number, request: DepartmentRequest) {
  const response = await apiClient.put<Department>(`/admin/departments/${id}`, request);
  return response.data;
}

export async function updateDepartmentStatus(id: number, active: boolean) {
  const response = await apiClient.patch<Department>(`/admin/departments/${id}/status`, { active });
  return response.data;
}
