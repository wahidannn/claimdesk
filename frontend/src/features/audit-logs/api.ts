import { apiClient } from '../../lib/api-client';
import { cleanParams } from '../../lib/query-params';
import type { AuditLogListParams, AuditLogListResponse } from './types';

export async function listAuditLogs(params: AuditLogListParams = {}) {
  const response = await apiClient.get<AuditLogListResponse>('/admin/audit-logs', { params: cleanParams(params) });
  return response.data;
}
