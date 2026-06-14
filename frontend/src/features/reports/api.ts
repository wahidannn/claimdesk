import { apiClient } from '../../lib/api-client';
import { cleanParams } from '../../lib/query-params';
import type { AuditLogListParams } from '../audit-logs/types';
import type { ClaimReportListResponse, ClaimReportParams, ClaimReportSummary } from './types';

export async function listClaimReports(params: ClaimReportParams = {}) {
  const response = await apiClient.get<ClaimReportListResponse>('/reports/claims', { params: cleanParams(params) });
  return response.data;
}

export async function getClaimReportSummary(params: ClaimReportParams = {}) {
  const response = await apiClient.get<ClaimReportSummary>('/reports/claims/summary', { params: cleanParams(params) });
  return response.data;
}

export async function exportClaimReport(params: ClaimReportParams = {}) {
  const response = await apiClient.get<Blob>('/reports/claims/export', {
    params: cleanParams(params),
    responseType: 'blob',
  });
  return response.data;
}

export async function exportAuditLogs(params: Pick<AuditLogListParams, 'dateFrom' | 'dateTo'> = {}) {
  const response = await apiClient.get<Blob>('/admin/audit-logs/export', {
    params: cleanParams(params),
    responseType: 'blob',
  });
  return response.data;
}
