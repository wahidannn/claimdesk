import type { Role } from '../auth/types';
import type { AuditLog } from '../audit-logs/types';
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

export type AdminDashboardSummary = {
  activeUsers: number;
  inactiveUsers: number;
  activeDepartments: number;
  inactiveDepartments: number;
  activeCategories: number;
  inactiveCategories: number;
  totalClaims: number;
  totalClaimAmount: number;
  paidAmount: number;
  pendingClaims: number;
};

export type AdminDashboard = {
  summary: AdminDashboardSummary;
  userRoleBreakdown: DashboardBreakdownItem[];
  claimStatusBreakdown: DashboardBreakdownItem[];
  monthlyClaimTrend: DashboardBreakdownItem[];
  departmentBreakdown: DashboardBreakdownItem[];
  categoryBreakdown: DashboardBreakdownItem[];
  recentAuditLogs: AuditLog[];
};

export type ManagerDashboardSummary = {
  pendingApprovals: number;
  approvedByManager: number;
  rejectedByManager: number;
  pendingAmount: number;
  reviewedAmount: number;
  totalDepartmentClaims: number;
};

export type RecentManagerClaim = {
  id: number;
  title: string;
  amount: number;
  status: ClaimStatus;
  employeeName: string;
  categoryName: string;
  transactionDate: string;
  submittedAt: string | null;
};

export type ManagerDashboard = {
  summary: ManagerDashboardSummary;
  statusBreakdown: DashboardBreakdownItem[];
  monthlyTrend: DashboardBreakdownItem[];
  categoryBreakdown: DashboardBreakdownItem[];
  employeeBreakdown: DashboardBreakdownItem[];
  recentPendingClaims: RecentManagerClaim[];
};

export type FinanceDashboardSummary = {
  pendingFinanceReview: number;
  financeApproved: number;
  paidClaims: number;
  pendingPaymentClaims: number;
  pendingReviewAmount: number;
  approvedAmount: number;
  paidAmount: number;
  totalFinanceClaims: number;
};

export type RecentFinanceClaim = {
  id: number;
  title: string;
  amount: number;
  status: ClaimStatus;
  employeeName: string;
  departmentName: string;
  categoryName: string;
  transactionDate: string;
  reviewedAt: string | null;
};

export type FinanceDashboard = {
  summary: FinanceDashboardSummary;
  statusBreakdown: DashboardBreakdownItem[];
  monthlyPaidTrend: DashboardBreakdownItem[];
  categoryBreakdown: DashboardBreakdownItem[];
  departmentBreakdown: DashboardBreakdownItem[];
  recentReviewClaims: RecentFinanceClaim[];
};
