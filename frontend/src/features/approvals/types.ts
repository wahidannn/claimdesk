import type { PagedResponse } from '../../lib/api-types';
import type { ClaimCategory, ClaimEmployee, ClaimStatus, ExpenseAttachment } from '../claims/types';
import type { Role } from '../auth/types';

export type ApprovalAction = 'REVISION_REQUESTED' | 'MANAGER_APPROVED' | 'MANAGER_REJECTED' | 'FINANCE_APPROVED' | 'PAID';

export type ApprovalReviewer = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export type ApprovalNote = {
  id: number;
  action: ApprovalAction;
  note: string | null;
  reviewer: ApprovalReviewer;
  createdAt: string;
};

export type ReviewDepartment = {
  id: number;
  name: string;
};

export type ReviewClaim = {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  transactionDate: string;
  status: ClaimStatus;
  category: ClaimCategory;
  employee: ClaimEmployee;
  department: ReviewDepartment | null;
  attachments: ExpenseAttachment[];
  approvalNotes: ApprovalNote[];
  submittedAt: string | null;
  managerReviewedAt: string | null;
  financeReviewedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewListParams = {
  page?: number;
  size?: number;
  search?: string;
  status?: ClaimStatus | '';
  categoryId?: number | '';
  dateFrom?: string;
  dateTo?: string;
};

export type ReviewListResponse = PagedResponse<ReviewClaim>;

export type ApprovalNoteRequest = {
  note?: string;
};
