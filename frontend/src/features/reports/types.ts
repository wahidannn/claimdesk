import type { PagedResponse } from '../../lib/api-types';
import type { ClaimStatus } from '../claims/types';

export type ClaimReportRow = {
  claimId: number;
  title: string;
  employeeName: string;
  employeeEmail: string;
  departmentName: string | null;
  categoryName: string;
  amount: number;
  transactionDate: string;
  status: ClaimStatus;
  submittedAt: string | null;
  managerReviewedAt: string | null;
  financeReviewedAt: string | null;
  paidAt: string | null;
};

export type ClaimReportBreakdown = {
  label: string;
  count: number;
  amount: number;
};

export type ClaimReportSummary = {
  totalClaims: number;
  totalAmount: number;
  paidClaims: number;
  paidAmount: number;
  pendingClaims: number;
  rejectedClaims: number;
  byStatus: ClaimReportBreakdown[];
  byCategory: ClaimReportBreakdown[];
  byDepartment: ClaimReportBreakdown[];
};

export type ClaimReportParams = {
  page?: number;
  size?: number;
  search?: string;
  status?: ClaimStatus | '';
  departmentId?: number | '';
  employeeId?: number | '';
  categoryId?: number | '';
  dateFrom?: string;
  dateTo?: string;
};

export type ClaimReportListResponse = PagedResponse<ClaimReportRow>;
