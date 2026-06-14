import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../features/auth/useAuth';
import { getDashboardSummary } from '../features/dashboard/api';
import { formatCurrency } from '../features/claims/currency';

export function DashboardPage() {
  const { user } = useAuth();
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
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

      {summaryQuery.isLoading && <div className="text-sm text-slate-500">Loading dashboard...</div>}

      {summary && (
        <>
          {user.role === 'EMPLOYEE' && (
            <section className="grid gap-4 md:grid-cols-5">
              <SummaryCard title="Draft" value={summary.draftClaims ?? 0} />
              <SummaryCard title="Submitted" value={summary.submittedClaims ?? 0} />
              <SummaryCard title="Rejected" value={summary.rejectedClaims ?? 0} />
              <SummaryCard title="Paid" value={summary.paidClaims ?? 0} />
              <SummaryCard title="Total Amount" value={formatCurrency(summary.totalClaimAmount ?? 0)} />
            </section>
          )}

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

function SummaryCard({ title, value }: { title: string; value: string | number }) {
  return (
    <article className="rounded border border-border bg-surface p-5">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
    </article>
  );
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
