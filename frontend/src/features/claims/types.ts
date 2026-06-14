import type { ListParams } from '../../lib/api-types';

export type ClaimStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'MANAGER_APPROVED'
  | 'MANAGER_REJECTED'
  | 'FINANCE_APPROVED'
  | 'PAID'
  | 'CANCELLED';

export type ClaimCategory = {
  id: number;
  name: string;
  description?: string | null;
};

export type ClaimEmployee = {
  id: number;
  name: string;
  email: string;
};

export type ExpenseClaim = {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  transactionDate: string;
  status: ClaimStatus;
  submittedAt: string | null;
  category: ClaimCategory;
  employee: ClaimEmployee;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseAttachment = {
  id: number;
  claimId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
};

export type ClaimRequest = {
  title: string;
  amount: number;
  categoryId: number;
  transactionDate: string;
  description: string;
};

export type ClaimListParams = ListParams & {
  status?: ClaimStatus | '';
  categoryId?: number | '';
  dateFrom?: string;
  dateTo?: string;
};
