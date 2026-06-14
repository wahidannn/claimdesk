import type { Role } from '../auth/types';
import type { ClaimStatus } from '../claims/types';

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

export type DashboardBreakdownItem = {
  label: string;
  count: number;
  amount: number;
};

export type EmployeeDashboardSummary = {
  draftClaims: number;
  submittedClaims: number;
  rejectedClaims: number;
  paidClaims: number;
  totalClaimAmount: number;
  paidAmount: number;
  pendingAmount: number;
};

export type RecentEmployeeClaim = {
  id: number;
  title: string;
  amount: number;
  status: ClaimStatus;
  categoryName: string;
  transactionDate: string;
  updatedAt: string;
};

export type EmployeeDashboard = {
  summary: EmployeeDashboardSummary;
  statusBreakdown: DashboardBreakdownItem[];
  monthlyTrend: DashboardBreakdownItem[];
  categoryBreakdown: DashboardBreakdownItem[];
  recentClaims: RecentEmployeeClaim[];
};
