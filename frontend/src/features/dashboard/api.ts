import { apiClient } from '../../lib/api-client';
import type { DashboardSummary } from './types';

export async function getDashboardSummary() {
  const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
  return response.data;
}
