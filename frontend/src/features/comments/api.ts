import { apiClient } from '../../lib/api-client';
import type { ClaimComment, ClaimCommentRequest } from './types';

export async function listClaimComments(claimId: number) {
  const response = await apiClient.get<ClaimComment[]>(`/claims/${claimId}/comments`);
  return response.data;
}

export async function createClaimComment(claimId: number, request: ClaimCommentRequest) {
  const response = await apiClient.post<ClaimComment>(`/claims/${claimId}/comments`, request);
  return response.data;
}
