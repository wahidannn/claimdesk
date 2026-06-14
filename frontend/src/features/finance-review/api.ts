import { apiClient } from '../../lib/api-client';
import type { ApprovalNoteRequest, ReviewClaim, ReviewListParams, ReviewListResponse } from '../approvals/types';

export async function listFinanceClaims(params: ReviewListParams = {}) {
  const response = await apiClient.get<ReviewListResponse>('/finance/claims', { params });
  return response.data;
}

export async function getFinanceClaim(id: number) {
  const response = await apiClient.get<ReviewClaim>(`/finance/claims/${id}`);
  return response.data;
}

export async function approveFinanceClaim(id: number, request: ApprovalNoteRequest) {
  const response = await apiClient.post<ReviewClaim>(`/finance/claims/${id}/approve`, request);
  return response.data;
}

export async function markClaimPaid(id: number, request: ApprovalNoteRequest) {
  const response = await apiClient.post<ReviewClaim>(`/finance/claims/${id}/mark-paid`, request);
  return response.data;
}
