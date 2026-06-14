import { apiClient } from '../../lib/api-client';
import type { AuthUser, LoginRequest, LoginResponse } from './types';

export async function login(request: LoginRequest) {
  const response = await apiClient.post<LoginResponse>('/auth/login', request);
  return response.data;
}

export async function getMe() {
  const response = await apiClient.get<AuthUser>('/auth/me');
  return response.data;
}

export async function logout() {
  await apiClient.post('/auth/logout');
}
