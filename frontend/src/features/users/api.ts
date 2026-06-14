import { apiClient } from '../../lib/api-client';
import type { PagedResponse } from '../../lib/api-types';
import type { CreateUserRequest, ManagedUser, UpdateUserRequest, UserListParams } from './types';

export async function listUsers(params: UserListParams = {}) {
  const response = await apiClient.get<PagedResponse<ManagedUser>>('/admin/users', { params });
  return response.data;
}

export async function createUser(request: CreateUserRequest) {
  const response = await apiClient.post<ManagedUser>('/admin/users', request);
  return response.data;
}

export async function updateUser(id: number, request: UpdateUserRequest) {
  const response = await apiClient.put<ManagedUser>(`/admin/users/${id}`, request);
  return response.data;
}

export async function updateUserStatus(id: number, active: boolean) {
  const response = await apiClient.patch<ManagedUser>(`/admin/users/${id}/status`, { active });
  return response.data;
}
