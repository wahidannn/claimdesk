import { useMutation, useQuery } from '@tanstack/react-query';
import { Download, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, Td, Th } from '../components/ui/Table';
import { useAuth } from '../features/auth/useAuth';
import { listActiveCategories } from '../features/claims/api';
import { formatCurrency } from '../features/claims/currency';
import { StatusBadge } from '../features/claims/format';
import type { ClaimStatus } from '../features/claims/types';
import { exportAuditLogs, exportClaimReport, getClaimReportSummary, listClaimReports } from '../features/reports/api';
import type { ClaimReportParams } from '../features/reports/types';
import { getApiErrorMessage } from '../lib/api-error';

const statuses: ClaimStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'REVISION_REQUESTED',
  'REVISED',
  'MANAGER_APPROVED',
  'MANAGER_REJECTED',
  'FINANCE_APPROVED',
  'PAID',
  'CANCELLED',
];

export function ReportsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    departmentId: '',
    employeeId: '',
    categoryId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [auditDates, setAuditDates] = useState({ dateFrom: '', dateTo: '' });
  const [notice, setNotice] = useState<string | null>(null);

  const reportParams: ClaimReportParams = {
    page,
    size: 10,
    search: filters.search,
    status: filters.status as ClaimStatus | '',
    departmentId: filters.departmentId ? Number(filters.departmentId) : undefined,
    employeeId: filters.employeeId ? Number(filters.employeeId) : undefined,
    categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  };

  const reportsQuery = useQuery({
    queryKey: ['claim-reports', reportParams],
    queryFn: () => listClaimReports(reportParams),
  });

  const summaryQuery = useQuery({
    queryKey: ['claim-report-summary', filters],
    queryFn: () => getClaimReportSummary({ ...reportParams, page: undefined, size: undefined }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['active-categories'],
    queryFn: listActiveCategories,
  });

  const exportClaimMutation = useMutation({
    mutationFn: () => exportClaimReport({ ...reportParams, page: undefined, size: undefined }),
    onSuccess: (blob) => {
      downloadBlob(blob, `claim-report-${todayStamp()}.csv`);
      setNotice('Claim report berhasil diexport.');
    },
    onError: (error) => {
      setNotice(getApiErrorMessage(error, 'Gagal export claim report.'));
    },
  });

  const exportAuditMutation = useMutation({
    mutationFn: () => exportAuditLogs(auditDates),
    onSuccess: (blob) => {
      downloadBlob(blob, `audit-logs-${todayStamp()}.csv`);
      setNotice('Audit logs berhasil diexport.');
    },
    onError: (error) => {
      setNotice(getApiErrorMessage(error, 'Gagal export audit logs.'));
    },
  });

  const reports = reportsQuery.data?.items ?? [];
  const totalPages = reportsQuery.data?.totalPages ?? 0;
  const categories = categoriesQuery.data ?? [];
  const summary = summaryQuery.data;

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setFilters(draftFilters);
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Rekap claim dan export CSV berdasarkan scope role kamu.</p>
        </div>
        <Button type="button" onClick={() => exportClaimMutation.mutate()} disabled={exportClaimMutation.isPending}>
          <Download size={16} />
          Export Claim CSV
        </Button>
      </div>

      {notice && (
        <div className="rounded-md border border-accent/20 bg-accentSoft px-4 py-3 text-sm font-medium text-accent">{notice}</div>
      )}

      {summary && (
        <section className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <SummaryCard title="Total Claims" value={summary.totalClaims} />
          <SummaryCard title="Total Amount" value={formatCurrency(summary.totalAmount)} />
          <SummaryCard title="Paid Amount" value={formatCurrency(summary.paidAmount)} />
          <SummaryCard title="Pending" value={summary.pendingClaims} />
          <SummaryCard title="Rejected" value={summary.rejectedClaims} />
        </section>
      )}

      <form
        className="grid min-w-0 gap-3 rounded-lg border border-border bg-surface p-3 shadow-card sm:grid-cols-2 lg:grid-cols-[minmax(0,1.7fr)_repeat(4,minmax(0,1fr))_auto]"
        onSubmit={handleSearch}
      >
        <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mutedText/70" size={17} />
          <Input
            className="pl-10"
            value={draftFilters.search}
            onChange={(event) => setDraftFilters((value) => ({ ...value, search: event.target.value }))}
            placeholder="Search claim or employee"
          />
        </div>
        <Select
          value={draftFilters.status}
          onChange={(event) => setDraftFilters((value) => ({ ...value, status: event.target.value }))}
        >
          <option value="">All status</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Select
          value={draftFilters.categoryId}
          onChange={(event) => setDraftFilters((value) => ({ ...value, categoryId: event.target.value }))}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={draftFilters.dateFrom}
          onChange={(event) => setDraftFilters((value) => ({ ...value, dateFrom: event.target.value }))}
        />
        <Input
          type="date"
          value={draftFilters.dateTo}
          onChange={(event) => setDraftFilters((value) => ({ ...value, dateTo: event.target.value }))}
        />
        <Button type="submit" className="w-full lg:w-auto">
          Search
        </Button>
      </form>

      <section className="grid gap-4 lg:grid-cols-3">
        <Breakdown title="By Status" items={summary?.byStatus ?? []} />
        <Breakdown title="By Category" items={summary?.byCategory ?? []} />
        <Breakdown title="By Department" items={summary?.byDepartment ?? []} />
      </section>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        <Table>
          <thead>
            <tr>
              <Th>Claim</Th>
              <Th>Employee</Th>
              <Th>Department</Th>
              <Th>Category</Th>
              <Th className="whitespace-nowrap">Amount</Th>
              <Th>Status</Th>
              <Th className="w-36 whitespace-nowrap">Paid At</Th>
            </tr>
          </thead>
          <tbody>
            {reports.map((row) => (
              <tr key={row.claimId}>
                <Td className="min-w-52">
                  <div className="line-clamp-1 font-semibold">{row.title}</div>
                  <div className="text-xs text-mutedText">{row.transactionDate}</div>
                </Td>
                <Td className="min-w-56">
                  <div className="font-semibold">{row.employeeName}</div>
                  <div className="text-xs text-mutedText">{row.employeeEmail}</div>
                </Td>
                <Td>{row.departmentName ?? '-'}</Td>
                <Td>{row.categoryName}</Td>
                <Td className="whitespace-nowrap font-semibold">{formatCurrency(row.amount)}</Td>
                <Td>
                  <StatusBadge status={row.status} />
                </Td>
                <Td className="max-w-36 whitespace-nowrap text-sm">{formatShortDateTime(row.paidAt)}</Td>
              </tr>
            ))}
            {!reportsQuery.isLoading && reports.length === 0 && (
              <tr>
                <Td colSpan={7} className="text-center text-slate-500">
                  No report rows found.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {user?.role === 'ADMIN' && (
        <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Audit Log Export</h2>
              <p className="mt-1 text-sm text-slate-500">Export audit log CSV dengan filter tanggal sederhana.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                type="date"
                value={auditDates.dateFrom}
                onChange={(event) => setAuditDates((value) => ({ ...value, dateFrom: event.target.value }))}
              />
              <Input
                type="date"
                value={auditDates.dateTo}
                onChange={(event) => setAuditDates((value) => ({ ...value, dateTo: event.target.value }))}
              />
              <Button type="button" onClick={() => exportAuditMutation.mutate()} disabled={exportAuditMutation.isPending}>
                <Download size={16} />
                Export Audit CSV
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string | number }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
      <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-mutedText">{title}</p>
      <p className="mt-2 truncate whitespace-nowrap text-[clamp(1.05rem,1.5vw,1.35rem)] font-bold leading-tight tracking-tight text-ink">
        {value}
      </p>
    </article>
  );
}

function Breakdown({ title, items }: { title: string; items: Array<{ label: string; count: number; amount: number }> }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.slice(0, 5).map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{item.label}</p>
              <p className="text-mutedText">{item.count} claims</p>
            </div>
            <Badge>{formatCurrency(item.amount)}</Badge>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-mutedText">No data.</p>}
      </div>
    </article>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 30_000);
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function formatShortDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
