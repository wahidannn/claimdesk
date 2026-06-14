import { apiClient } from '../../lib/api-client';
import type { PagedResponse } from '../../lib/api-types';
import type { ClaimCategory, ClaimListParams, ClaimRequest, ExpenseAttachment, ExpenseClaim } from './types';

export async function listClaims(params: ClaimListParams = {}) {
  const response = await apiClient.get<PagedResponse<ExpenseClaim>>('/claims', { params });
  return response.data;
}

export async function getClaim(id: number) {
  const response = await apiClient.get<ExpenseClaim>(`/claims/${id}`);
  return response.data;
}

export async function createClaim(request: ClaimRequest) {
  const response = await apiClient.post<ExpenseClaim>('/claims', request);
  return response.data;
}

export async function updateClaim(id: number, request: ClaimRequest) {
  const response = await apiClient.put<ExpenseClaim>(`/claims/${id}`, request);
  return response.data;
}

export async function submitClaim(id: number) {
  const response = await apiClient.post<ExpenseClaim>(`/claims/${id}/submit`);
  return response.data;
}

export async function cancelClaim(id: number) {
  const response = await apiClient.post<ExpenseClaim>(`/claims/${id}/cancel`);
  return response.data;
}

export async function listActiveCategories() {
  const response = await apiClient.get<ClaimCategory[]>('/categories/active');
  return response.data;
}

export async function listClaimAttachments(claimId: number) {
  const response = await apiClient.get<ExpenseAttachment[]>(`/claims/${claimId}/attachments`);
  return response.data;
}

export async function uploadClaimAttachment(claimId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ExpenseAttachment>(`/claims/${claimId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function deleteAttachment(id: number) {
  await apiClient.delete(`/attachments/${id}`);
}

export async function downloadAttachment(id: number) {
  const response = await apiClient.get<Blob>(`/attachments/${id}`, {
    responseType: 'blob',
  });
  return response.data;
}
