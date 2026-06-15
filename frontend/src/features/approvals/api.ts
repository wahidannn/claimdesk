import { apiClient } from '../../lib/api-client';
import type { ApprovalNoteRequest, ReviewClaim, ReviewListParams, ReviewListResponse } from './types';

export async function listManagerClaims(params: ReviewListParams = {}) {
  const response = await apiClient.get<ReviewListResponse>('/manager/claims', { params });
  return response.data;
}

export async function getManagerClaim(id: number) {
  const response = await apiClient.get<ReviewClaim>(`/manager/claims/${id}`);
  return response.data;
}

export async function approveManagerClaim(id: number, request: ApprovalNoteRequest) {
  const response = await apiClient.post<ReviewClaim>(`/manager/claims/${id}/approve`, request);
  return response.data;
}

export async function rejectManagerClaim(id: number, request: ApprovalNoteRequest) {
  const response = await apiClient.post<ReviewClaim>(`/manager/claims/${id}/reject`, request);
  return response.data;
}

export async function requestClaimRevision(id: number, request: ApprovalNoteRequest) {
  const response = await apiClient.post<ReviewClaim>(`/manager/claims/${id}/request-revision`, request);
  return response.data;
}
