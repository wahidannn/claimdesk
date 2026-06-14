import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FilePlus2, WalletCards } from 'lucide-react';
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
import { getDashboardSummary, getEmployeeDashboard } from '../features/dashboard/api';
import type { DashboardBreakdownItem, EmployeeDashboard, RecentEmployeeClaim } from '../features/dashboard/types';
import { formatCurrency } from '../features/claims/currency';
import type { ClaimStatus } from '../features/claims/types';

export function DashboardPage() {
  const { user } = useAuth();
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    enabled: user?.role !== 'EMPLOYEE',
  });
  const employeeDashboardQuery = useQuery({
    queryKey: ['employee-dashboard'],
    queryFn: getEmployeeDashboard,
    enabled: user?.role === 'EMPLOYEE',
  });
  const summary = summaryQuery.data;

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded border border-border bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge>Dashboard</Badge>
            <h1 className="mt-3 text-2xl font-semibold">{dashboardTitle(user.role)}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
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

      {user.role !== 'EMPLOYEE' && summaryQuery.isLoading && <div className="text-sm text-slate-500">Loading dashboard...</div>}

      {user.role !== 'EMPLOYEE' && summary && (
        <>
          {user.role === 'MANAGER' && (
            <section className="grid gap-4 md:grid-cols-3">
              <SummaryCard title="Pending Approval" value={summary.pendingApprovals ?? 0} />
              <SummaryCard title="Approved" value={summary.approvedByManager ?? 0} />
              <SummaryCard title="Rejected" value={summary.rejectedByManager ?? 0} />
            </section>
          )}

          {user.role === 'FINANCE' && (
            <section className="grid gap-4 md:grid-cols-4">
              <SummaryCard title="Pending Review" value={summary.pendingFinanceReview ?? 0} />
              <SummaryCard title="Finance Approved" value={summary.financeApproved ?? 0} />
              <SummaryCard title="Paid Claims" value={summary.paidClaims ?? 0} />
              <SummaryCard title="Paid Amount" value={formatCurrency(summary.paidAmount ?? 0)} />
            </section>
          )}

          {user.role === 'ADMIN' && (
            <section className="grid gap-4 md:grid-cols-3">
              <SummaryCard title="Active Users" value={summary.activeUsers ?? 0} />
              <SummaryCard title="Active Departments" value={summary.activeDepartments ?? 0} />
              <SummaryCard title="Active Categories" value={summary.activeCategories ?? 0} />
            </section>
          )}
        </>
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
      <section className="rounded border border-red-200 bg-red-50 p-5 text-sm text-red-700">
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
      <section className="rounded border border-border bg-surface p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-blue-50 text-accent">
          <FilePlus2 size={22} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-ink">No claims yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
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
        <article className="rounded border border-border bg-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Total submitted value</p>
              <p className="mt-3 text-3xl font-semibold text-ink">{formatCurrency(dashboard.summary.totalClaimAmount)}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded bg-blue-50 text-accent">
              <WalletCards size={22} />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <AmountPanel label="Paid amount" value={dashboard.summary.paidAmount} tone="green" />
            <AmountPanel label="Pending amount" value={dashboard.summary.pendingAmount} tone="amber" />
          </div>
        </article>

        <article className="rounded border border-border bg-surface p-6">
          <p className="text-sm font-medium text-slate-500">Quick actions</p>
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
        <div className="h-48 animate-pulse rounded border border-border bg-muted" />
        <div className="h-48 animate-pulse rounded border border-border bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded border border-border bg-muted" />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string | number }) {
  return (
    <article className="rounded border border-border bg-surface p-5">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
    </article>
  );
}

function AmountPanel({ label, value, tone }: { label: string; value: number; tone: 'green' | 'amber' }) {
  const className = tone === 'green'
    ? 'border-green-200 bg-green-50 text-green-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <div className={`rounded border p-4 ${className}`}>
      <p className="text-xs font-medium uppercase">{label}</p>
      <p className="mt-2 text-lg font-semibold">{formatCurrency(value)}</p>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
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

function MonthlyAmountChart({ data }: { data: DashboardBreakdownItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="monthlyAmount" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={compactCurrency} tickLine={false} axisLine={false} width={56} />
        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
        <Area type="monotone" dataKey="amount" stroke="#2563eb" fill="url(#monthlyAmount)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CategoryBreakdownChart({ data }: { data: DashboardBreakdownItem[] }) {
  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500">No category data yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tickFormatter={compactCurrency} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
        <Bar dataKey="amount" radius={[0, 6, 6, 0]} fill="#0f766e" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RecentClaimsTable({ claims }: { claims: RecentEmployeeClaim[] }) {
  return (
    <article className="rounded border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">Recent claims</h2>
        <Button asChild variant="ghost" className="h-8 px-2">
          <Link to="/claims">View all</Link>
        </Button>
      </div>
      <div className="mt-4 overflow-hidden rounded border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <tbody className="divide-y divide-border bg-surface">
            {claims.map((claim) => (
              <tr key={claim.id} className="hover:bg-muted">
                <td className="px-4 py-3">
                  <Link to={`/claims/${claim.id}`} className="font-medium text-ink hover:text-accent">
                    {claim.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">{claim.categoryName} · {claim.transactionDate}</p>
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

function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <Badge className={`${statusBadgeClass(status)} border`}>
      {formatStatus(status)}
    </Badge>
  );
}

function statusColor(status: ClaimStatus) {
  const colors: Record<ClaimStatus, string> = {
    DRAFT: '#64748b',
    SUBMITTED: '#2563eb',
    MANAGER_APPROVED: '#0f766e',
    MANAGER_REJECTED: '#dc2626',
    FINANCE_APPROVED: '#d97706',
    PAID: '#16a34a',
    CANCELLED: '#475569',
  };

  return colors[status];
}

function statusBadgeClass(status: ClaimStatus) {
  const classes: Record<ClaimStatus, string> = {
    DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
    SUBMITTED: 'border-blue-200 bg-blue-50 text-blue-700',
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
