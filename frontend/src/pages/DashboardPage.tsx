import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ClipboardCheck, FilePlus2, ShieldCheck, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../features/auth/useAuth';
import { getAdminDashboard, getEmployeeDashboard, getFinanceDashboard, getManagerDashboard } from '../features/dashboard/api';
import type {
  AdminDashboard,
  DashboardBreakdownItem,
  EmployeeDashboard,
  FinanceDashboard,
  ManagerDashboard,
  RecentEmployeeClaim,
  RecentFinanceClaim,
  RecentManagerClaim,
} from '../features/dashboard/types';
import { formatCurrency } from '../features/claims/currency';
import type { ClaimStatus } from '../features/claims/types';

export function DashboardPage() {
  const { user } = useAuth();
  const employeeDashboardQuery = useQuery({
    queryKey: ['employee-dashboard'],
    queryFn: getEmployeeDashboard,
    enabled: user?.role === 'EMPLOYEE',
  });
  const adminDashboardQuery = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
    enabled: user?.role === 'ADMIN',
  });
  const managerDashboardQuery = useQuery({
    queryKey: ['manager-dashboard'],
    queryFn: getManagerDashboard,
    enabled: user?.role === 'MANAGER',
  });
  const financeDashboardQuery = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: getFinanceDashboard,
    enabled: user?.role === 'FINANCE',
  });

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge>Dashboard</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">{dashboardTitle(user.role)}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-mutedText">
              Ringkasan aktivitas ClaimDesk yang paling relevan untuk role kamu.
            </p>
          </div>
          <DashboardAction role={user.role} />
        </div>
      </section>

      {user.role === 'EMPLOYEE' && (
        <EmployeeDashboardView
          dashboard={employeeDashboardQuery.data}
          isLoading={employeeDashboardQuery.isLoading}
          isError={employeeDashboardQuery.isError}
        />
      )}

      {user.role === 'ADMIN' && (
        <AdminDashboardView
          dashboard={adminDashboardQuery.data}
          isLoading={adminDashboardQuery.isLoading}
          isError={adminDashboardQuery.isError}
        />
      )}

      {user.role === 'MANAGER' && (
        <ManagerDashboardView
          dashboard={managerDashboardQuery.data}
          isLoading={managerDashboardQuery.isLoading}
          isError={managerDashboardQuery.isError}
        />
      )}

      {user.role === 'FINANCE' && (
        <FinanceDashboardView
          dashboard={financeDashboardQuery.data}
          isLoading={financeDashboardQuery.isLoading}
          isError={financeDashboardQuery.isError}
        />
      )}
    </div>
  );
}

function EmployeeDashboardView({
  dashboard,
  isLoading,
  isError,
}: {
  dashboard: EmployeeDashboard | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <EmployeeDashboardSkeleton />;
  }

  if (isError) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
        Employee dashboard could not be loaded. Please refresh the page.
      </section>
    );
  }

  if (!dashboard) {
    return null;
  }

  const hasClaims = dashboard.statusBreakdown.some((item) => item.count > 0);

  if (!hasClaims) {
    return (
      <section className="rounded-lg border border-border bg-surface p-8 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-accentSoft text-accent">
          <FilePlus2 size={22} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-ink">No claims yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mutedText">
          Start by creating your first expense claim. Your activity, status breakdown, and recent claims will appear here.
        </p>
        <Button asChild className="mt-5">
          <Link to="/claims/new">Create claim</Link>
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-mutedText">Total submitted value</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-ink">{formatCurrency(dashboard.summary.totalClaimAmount)}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accentSoft text-accent">
              <WalletCards size={22} />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <AmountPanel label="Paid amount" value={dashboard.summary.paidAmount} tone="green" />
            <AmountPanel label="Pending amount" value={dashboard.summary.pendingAmount} tone="amber" />
          </div>
        </article>

        <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <p className="text-sm font-semibold text-mutedText">Quick actions</p>
          <div className="mt-5 space-y-3">
            <Button asChild className="w-full justify-between">
              <Link to="/claims/new">
                Create new claim
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="secondary">
              <Link to="/claims">
                View all claims
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <SummaryCard title="Draft" value={dashboard.summary.draftClaims} />
        <SummaryCard title="Submitted" value={dashboard.summary.submittedClaims} />
        <SummaryCard title="Rejected" value={dashboard.summary.rejectedClaims} />
        <SummaryCard title="Paid" value={dashboard.summary.paidClaims} />
        <SummaryCard title="Pending Amount" value={formatCurrency(dashboard.summary.pendingAmount)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ChartPanel title="Claim status">
          <StatusPieChart data={dashboard.statusBreakdown.filter((item) => item.count > 0)} />
        </ChartPanel>
        <ChartPanel title="Monthly amount trend">
          <MonthlyAmountChart data={dashboard.monthlyTrend} />
        </ChartPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ChartPanel title="Category breakdown">
          <CategoryBreakdownChart data={dashboard.categoryBreakdown.slice(0, 6)} />
        </ChartPanel>
        <RecentClaimsTable claims={dashboard.recentClaims} />
      </section>
    </div>
  );
}

function AdminDashboardView({
  dashboard,
  isLoading,
  isError,
}: {
  dashboard: AdminDashboard | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <EmployeeDashboardSkeleton />;
  }

  if (isError) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
        Admin dashboard could not be loaded. Please refresh the page.
      </section>
    );
  }

  if (!dashboard) {
    return null;
  }

  const hasClaims = dashboard.claimStatusBreakdown.some((item) => item.count > 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-mutedText">System claim value</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-ink">{formatCurrency(dashboard.summary.totalClaimAmount)}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-teal-50 text-teal-700">
              <ShieldCheck size={22} />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <AmountPanel label="Paid amount" value={dashboard.summary.paidAmount} tone="green" />
            <AmountPanel label="Pending claims" value={dashboard.summary.pendingClaims} tone="blue" format="number" />
            <AmountPanel label="Total claims" value={dashboard.summary.totalClaims} tone="slate" format="number" />
          </div>
        </article>

        <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <p className="text-sm font-semibold text-mutedText">Admin shortcuts</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <DashboardLink to="/users" label="Manage users" />
            <DashboardLink to="/departments" label="Departments" />
            <DashboardLink to="/categories" label="Categories" />
            <DashboardLink to="/audit-logs" label="Audit logs" />
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <SummaryCard title="Active Users" value={dashboard.summary.activeUsers} />
        <SummaryCard title="Inactive Users" value={dashboard.summary.inactiveUsers} />
        <SummaryCard title="Departments" value={`${dashboard.summary.activeDepartments} active`} />
        <SummaryCard title="Categories" value={`${dashboard.summary.activeCategories} active`} />
        <SummaryCard title="Pending Claims" value={dashboard.summary.pendingClaims} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ChartPanel title="User role distribution">
          <RolePieChart data={dashboard.userRoleBreakdown.filter((item) => item.count > 0)} />
        </ChartPanel>
        <ChartPanel title="Monthly claim amount">
          <MonthlyAmountChart data={dashboard.monthlyClaimTrend} />
        </ChartPanel>
      </section>

      {hasClaims ? (
        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <ChartPanel title="Claim status overview">
            <StatusPieChart data={dashboard.claimStatusBreakdown.filter((item) => item.count > 0)} />
          </ChartPanel>
          <ChartPanel title="Department claim value">
            <CategoryBreakdownChart data={dashboard.departmentBreakdown.slice(0, 6)} />
          </ChartPanel>
        </section>
      ) : (
        <section className="rounded-lg border border-border bg-surface p-8 text-center shadow-card">
          <h2 className="text-lg font-semibold text-ink">No claim data yet</h2>
          <p className="mt-2 text-sm text-mutedText">Claim charts will appear once employees start submitting expenses.</p>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ChartPanel title="Category claim value">
          <CategoryBreakdownChart data={dashboard.categoryBreakdown.slice(0, 6)} />
        </ChartPanel>
        <RecentAuditLogs logs={dashboard.recentAuditLogs} />
      </section>
    </div>
  );
}

function ManagerDashboardView({
  dashboard,
  isLoading,
  isError,
}: {
  dashboard: ManagerDashboard | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <EmployeeDashboardSkeleton />;
  }

  if (isError) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
        Manager dashboard could not be loaded. Please refresh the page.
      </section>
    );
  }

  if (!dashboard) {
    return null;
  }

  const hasClaims = dashboard.statusBreakdown.some((item) => item.count > 0);
  const hasPendingClaims = dashboard.recentPendingClaims.length > 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-mutedText">Pending approval amount</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-ink">{formatCurrency(dashboard.summary.pendingAmount)}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accentSoft text-accent">
              <ClipboardCheck size={22} />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <AmountPanel label="Pending approvals" value={dashboard.summary.pendingApprovals} tone="blue" format="number" />
            <AmountPanel label="Reviewed amount" value={dashboard.summary.reviewedAmount} tone="green" />
            <AmountPanel label="Department claims" value={dashboard.summary.totalDepartmentClaims} tone="slate" format="number" />
          </div>
        </article>

        <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <p className="text-sm font-semibold text-mutedText">Approval actions</p>
          <div className="mt-5 space-y-3">
            <Button asChild className="w-full justify-between">
              <Link to="/approvals">
                Open approval queue
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="secondary">
              <Link to="/reports">
                View reports
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <SummaryCard title="Pending" value={dashboard.summary.pendingApprovals} />
        <SummaryCard title="Approved" value={dashboard.summary.approvedByManager} />
        <SummaryCard title="Rejected" value={dashboard.summary.rejectedByManager} />
        <SummaryCard title="Department Claims" value={dashboard.summary.totalDepartmentClaims} />
        <SummaryCard title="Reviewed Amount" value={formatCurrency(dashboard.summary.reviewedAmount)} />
      </section>

      {hasClaims ? (
        <>
          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <ChartPanel title="Approval status overview">
              <StatusPieChart data={dashboard.statusBreakdown.filter((item) => item.count > 0)} />
            </ChartPanel>
            <ChartPanel title="Monthly department amount">
              <MonthlyAmountChart data={dashboard.monthlyTrend} />
            </ChartPanel>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <ChartPanel title="Category amount">
              <CategoryBreakdownChart data={dashboard.categoryBreakdown.slice(0, 6)} />
            </ChartPanel>
            <ChartPanel title="Employee amount">
              <CategoryBreakdownChart data={dashboard.employeeBreakdown.slice(0, 6)} />
            </ChartPanel>
          </section>
        </>
      ) : (
        <section className="rounded-lg border border-border bg-surface p-8 text-center shadow-card">
          <h2 className="text-lg font-semibold text-ink">No department claim data yet</h2>
          <p className="mt-2 text-sm text-mutedText">Submitted claims from your department will appear here.</p>
        </section>
      )}

      {hasPendingClaims ? (
        <RecentManagerClaimsTable claims={dashboard.recentPendingClaims} />
      ) : (
        <section className="rounded-lg border border-border bg-surface p-8 text-center shadow-card">
          <h2 className="text-lg font-semibold text-ink">No pending approvals</h2>
          <p className="mt-2 text-sm text-mutedText">Your approval queue is clear right now.</p>
          <Button asChild className="mt-5" variant="secondary">
            <Link to="/approvals">Open approval queue</Link>
          </Button>
        </section>
      )}
    </div>
  );
}

function FinanceDashboardView({
  dashboard,
  isLoading,
  isError,
}: {
  dashboard: FinanceDashboard | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <EmployeeDashboardSkeleton />;
  }

  if (isError) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
        Finance dashboard could not be loaded. Please refresh the page.
      </section>
    );
  }

  if (!dashboard) {
    return null;
  }

  const hasFinanceClaims = dashboard.statusBreakdown.some((item) => item.count > 0);
  const hasReviewClaims = dashboard.recentReviewClaims.length > 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-mutedText">Pending review amount</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-ink">{formatCurrency(dashboard.summary.pendingReviewAmount)}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-amber-50 text-amber-700">
              <WalletCards size={22} />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <AmountPanel label="Approved amount" value={dashboard.summary.approvedAmount} tone="amber" />
            <AmountPanel label="Paid amount" value={dashboard.summary.paidAmount} tone="green" />
            <AmountPanel label="Pending payment" value={dashboard.summary.pendingPaymentClaims} tone="blue" format="number" />
          </div>
        </article>

        <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <p className="text-sm font-semibold text-mutedText">Finance actions</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <DashboardLink to="/finance-review" label="Open finance review" />
            <DashboardLink to="/reports" label="Open reports" />
            <DashboardLink to="/categories" label="Manage categories" />
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <SummaryCard title="Pending Review" value={dashboard.summary.pendingFinanceReview} />
        <SummaryCard title="Finance Approved" value={dashboard.summary.financeApproved} />
        <SummaryCard title="Pending Payment" value={dashboard.summary.pendingPaymentClaims} />
        <SummaryCard title="Paid Claims" value={dashboard.summary.paidClaims} />
        <SummaryCard title="Finance Claims" value={dashboard.summary.totalFinanceClaims} />
      </section>

      {hasFinanceClaims ? (
        <>
          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <ChartPanel title="Finance status overview">
              <StatusPieChart data={dashboard.statusBreakdown.filter((item) => item.count > 0)} />
            </ChartPanel>
            <ChartPanel title="Monthly paid amount">
              <MonthlyAmountChart data={dashboard.monthlyPaidTrend} />
            </ChartPanel>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <ChartPanel title="Category finance value">
              <CategoryBreakdownChart data={dashboard.categoryBreakdown.slice(0, 6)} />
            </ChartPanel>
            <ChartPanel title="Department finance value">
              <CategoryBreakdownChart data={dashboard.departmentBreakdown.slice(0, 6)} />
            </ChartPanel>
          </section>
        </>
      ) : (
        <section className="rounded-lg border border-border bg-surface p-8 text-center shadow-card">
          <h2 className="text-lg font-semibold text-ink">No finance claim data yet</h2>
          <p className="mt-2 text-sm text-mutedText">Claims approved by managers will appear here for finance review.</p>
        </section>
      )}

      {hasReviewClaims ? (
        <RecentFinanceClaimsTable claims={dashboard.recentReviewClaims} />
      ) : (
        <section className="rounded-lg border border-border bg-surface p-8 text-center shadow-card">
          <h2 className="text-lg font-semibold text-ink">No finance review queue</h2>
          <p className="mt-2 text-sm text-mutedText">There are no manager-approved or payment-ready claims right now.</p>
          <Button asChild className="mt-5" variant="secondary">
            <Link to="/finance-review">Open finance review</Link>
          </Button>
        </section>
      )}
    </div>
  );
}

function DashboardAction({ role }: { role: string }) {
  if (role === 'EMPLOYEE') {
    return (
      <Button asChild>
        <Link to="/claims/new">New Claim</Link>
      </Button>
    );
  }

  if (role === 'MANAGER') {
    return (
      <Button asChild>
        <Link to="/approvals">Open Approvals</Link>
      </Button>
    );
  }

  if (role === 'FINANCE') {
    return (
      <Button asChild>
        <Link to="/finance-review">Open Finance Review</Link>
      </Button>
    );
  }

  return (
    <Button asChild>
      <Link to="/users">Manage Users</Link>
    </Button>
  );
}

function EmployeeDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-lg border border-border bg-sidebar" />
        <div className="h-48 animate-pulse rounded-lg border border-border bg-sidebar" />
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg border border-border bg-sidebar" />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string | number }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-card">
      <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-mutedText">{title}</p>
      <p className="mt-3 break-words text-[clamp(1.25rem,2vw,1.75rem)] font-bold leading-tight tracking-tight text-ink">
        {value}
      </p>
    </article>
  );
}

function DashboardLink({ to, label }: { to: string; label: string }) {
  return (
    <Button asChild className="w-full justify-between" variant="secondary">
      <Link to={to}>
        {label}
        <ArrowRight size={16} />
      </Link>
    </Button>
  );
}

function AmountPanel({
  label,
  value,
  tone,
  format = 'currency',
}: {
  label: string;
  value: number;
  tone: 'green' | 'amber' | 'blue' | 'slate';
  format?: 'currency' | 'number';
}) {
  const className = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    blue: 'border-sky-200 bg-sky-50 text-sky-700',
    slate: 'border-border bg-sidebar text-ink',
  }[tone];

  return (
    <div className={`rounded-md border p-4 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-2 text-lg font-bold">{format === 'currency' ? formatCurrency(value) : value}</p>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <div className="mt-4 h-72">{children}</div>
    </article>
  );
}

function StatusPieChart({ data }: { data: DashboardBreakdownItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="label" innerRadius={54} outerRadius={88} paddingAngle={3}>
          {data.map((item) => (
            <Cell key={item.label} fill={statusColor(item.label as ClaimStatus)} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [value, formatStatus(String(name))]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function RolePieChart({ data }: { data: DashboardBreakdownItem[] }) {
  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-mutedText">No user data yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="label" innerRadius={54} outerRadius={88} paddingAngle={3}>
          {data.map((item) => (
            <Cell key={item.label} fill={roleColor(item.label)} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [value, formatStatus(String(name))]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function MonthlyAmountChart({ data }: { data: DashboardBreakdownItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="monthlyAmount" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#079669" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#079669" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6EAE8" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#7C8A86' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#7C8A86' }} tickFormatter={compactCurrency} tickLine={false} axisLine={false} width={56} />
        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
        <Area type="monotone" dataKey="amount" stroke="#079669" fill="url(#monthlyAmount)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CategoryBreakdownChart({ data }: { data: DashboardBreakdownItem[] }) {
  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-mutedText">No category data yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6EAE8" />
        <XAxis type="number" tickFormatter={compactCurrency} tick={{ fontSize: 12, fill: '#7C8A86' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 12, fill: '#7C8A86' }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
        <Bar dataKey="amount" radius={[0, 6, 6, 0]} fill="#079669" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RecentClaimsTable({ claims }: { claims: RecentEmployeeClaim[] }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-ink">Recent claims</h2>
        <Button asChild variant="ghost" className="h-8 px-2">
          <Link to="/claims">View all</Link>
        </Button>
      </div>
      <div className="mt-4 overflow-hidden rounded-md border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <tbody className="divide-y divide-border bg-surface">
            {claims.map((claim) => (
              <tr key={claim.id} className="transition hover:bg-accentSoft/45">
                <td className="px-4 py-3">
                  <Link to={`/claims/${claim.id}`} className="font-medium text-ink hover:text-accent">
                    {claim.title}
                  </Link>
                  <p className="mt-1 text-xs text-mutedText">{claim.categoryName} - {claim.transactionDate}</p>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(claim.amount)}</td>
                <td className="px-4 py-3 text-right">
                  <StatusBadge status={claim.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function RecentManagerClaimsTable({ claims }: { claims: RecentManagerClaim[] }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-ink">Recent pending approvals</h2>
        <Button asChild variant="ghost" className="h-8 px-2">
          <Link to="/approvals">View all</Link>
        </Button>
      </div>
      <div className="mt-4 overflow-hidden rounded-md border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <tbody className="divide-y divide-border bg-surface">
            {claims.map((claim) => (
              <tr key={claim.id} className="transition hover:bg-accentSoft/45">
                <td className="px-4 py-3">
                  <Link to={`/approvals/${claim.id}`} className="font-medium text-ink hover:text-accent">
                    {claim.title}
                  </Link>
                  <p className="mt-1 text-xs text-mutedText">
                    {claim.employeeName} - {claim.categoryName} - {claim.transactionDate}
                  </p>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(claim.amount)}</td>
                <td className="px-4 py-3 text-right">
                  <StatusBadge status={claim.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function RecentFinanceClaimsTable({ claims }: { claims: RecentFinanceClaim[] }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-ink">Recent finance review</h2>
        <Button asChild variant="ghost" className="h-8 px-2">
          <Link to="/finance-review">View all</Link>
        </Button>
      </div>
      <div className="mt-4 overflow-hidden rounded-md border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <tbody className="divide-y divide-border bg-surface">
            {claims.map((claim) => (
              <tr key={claim.id} className="transition hover:bg-accentSoft/45">
                <td className="px-4 py-3">
                  <Link to={`/finance-review/${claim.id}`} className="font-medium text-ink hover:text-accent">
                    {claim.title}
                  </Link>
                  <p className="mt-1 text-xs text-mutedText">
                    {claim.employeeName} - {claim.departmentName} - {claim.categoryName}
                  </p>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(claim.amount)}</td>
                <td className="px-4 py-3 text-right">
                  <StatusBadge status={claim.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function RecentAuditLogs({ logs }: { logs: AdminDashboard['recentAuditLogs'] }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-ink">Recent audit logs</h2>
        <Button asChild variant="ghost" className="h-8 px-2">
          <Link to="/audit-logs">View all</Link>
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="mt-4 rounded-md border border-border bg-muted p-6 text-center text-sm text-mutedText">
          No audit activity yet.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-md border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <tbody className="divide-y divide-border bg-surface">
              {logs.map((log) => (
                <tr key={log.id} className="transition hover:bg-accentSoft/45">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{formatStatus(log.action)}</p>
                    <p className="mt-1 text-xs text-mutedText">{log.actorEmail ?? 'System'} - {formatDateTime(log.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge className="border-slate-200 bg-slate-50 text-slate-700">{formatStatus(log.resourceType)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <Badge className={`${statusBadgeClass(status)} border`}>
      {formatStatus(status)}
    </Badge>
  );
}

function statusColor(status: ClaimStatus) {
  const colors: Record<ClaimStatus, string> = {
    DRAFT: '#7C8A86',
    SUBMITTED: '#4F7DF3',
    REVISION_REQUESTED: '#8B5CF6',
    REVISED: '#14B8A6',
    MANAGER_APPROVED: '#079669',
    MANAGER_REJECTED: '#EF4444',
    FINANCE_APPROVED: '#F59E0B',
    PAID: '#22C55E',
    CANCELLED: '#94A3B8',
  };

  return colors[status];
}

function roleColor(role: string) {
  const colors: Record<string, string> = {
    ADMIN: '#4F7DF3',
    EMPLOYEE: '#079669',
    MANAGER: '#F59E0B',
    FINANCE: '#EF4444',
  };

  return colors[role] ?? '#7C8A86';
}

function statusBadgeClass(status: ClaimStatus) {
  const classes: Record<ClaimStatus, string> = {
    DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
    SUBMITTED: 'border-sky-200 bg-sky-50 text-sky-700',
    REVISION_REQUESTED: 'border-purple-200 bg-purple-50 text-purple-700',
    REVISED: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    MANAGER_APPROVED: 'border-teal-200 bg-teal-50 text-teal-700',
    MANAGER_REJECTED: 'border-red-200 bg-red-50 text-red-700',
    FINANCE_APPROVED: 'border-amber-200 bg-amber-50 text-amber-700',
    PAID: 'border-green-200 bg-green-50 text-green-700',
    CANCELLED: 'border-slate-200 bg-slate-100 text-slate-700',
  };

  return classes[status];
}

function formatStatus(status: string) {
  return status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compactCurrency(value: number) {
  if (value >= 1_000_000) {
    return `${Math.round(value / 1_000_000)}M`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }

  return String(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function dashboardTitle(role: string) {
  if (role === 'EMPLOYEE') {
    return 'My Claim Summary';
  }

  if (role === 'MANAGER') {
    return 'Approval Summary';
  }

  if (role === 'FINANCE') {
    return 'Finance Summary';
  }

  return 'Admin Summary';
}
