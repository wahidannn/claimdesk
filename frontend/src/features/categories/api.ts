import { apiClient } from '../../lib/api-client';
import type { PagedResponse } from '../../lib/api-types';
import type { CategoryListParams, CategoryRequest, ExpenseCategory } from './types';

export async function listCategories(params: CategoryListParams = {}) {
  const response = await apiClient.get<PagedResponse<ExpenseCategory>>('/finance/categories', { params });
  return response.data;
}

export async function createCategory(request: CategoryRequest) {
  const response = await apiClient.post<ExpenseCategory>('/finance/categories', request);
  return response.data;
}

export async function updateCategory(id: number, request: CategoryRequest) {
  const response = await apiClient.put<ExpenseCategory>(`/finance/categories/${id}`, request);
  return response.data;
}

export async function updateCategoryStatus(id: number, active: boolean) {
  const response = await apiClient.patch<ExpenseCategory>(`/finance/categories/${id}/status`, { active });
  return response.data;
}
