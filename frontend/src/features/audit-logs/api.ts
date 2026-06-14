import { apiClient } from '../../lib/api-client';
import type { AuditLogListParams, AuditLogListResponse } from './types';

export async function listAuditLogs(params: AuditLogListParams = {}) {
  const response = await apiClient.get<AuditLogListResponse>('/admin/audit-logs', { params });
  return response.data;
}
