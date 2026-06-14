import type { Role } from '../auth/types';

export type DashboardSummary = {
  role: Role;
  draftClaims: number | null;
  submittedClaims: number | null;
  rejectedClaims: number | null;
  paidClaims: number | null;
  totalClaimAmount: number | null;
  pendingApprovals: number | null;
  approvedByManager: number | null;
  rejectedByManager: number | null;
  pendingFinanceReview: number | null;
  financeApproved: number | null;
  paidAmount: number | null;
  activeUsers: number | null;
  activeDepartments: number | null;
  activeCategories: number | null;
};
