import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Eye, Plus, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActionMenu } from '../components/ui/ActionMenu';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, Td, Th } from '../components/ui/Table';
import { cancelClaim, listActiveCategories, listClaims, submitClaim } from '../features/claims/api';
import { formatCurrency } from '../features/claims/currency';
import { StatusBadge } from '../features/claims/format';
import type { ClaimStatus } from '../features/claims/types';
import { getApiErrorMessage } from '../lib/api-error';
import { formatDate } from '../lib/date-format';

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

export function MyClaimsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    categoryId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [notice, setNotice] = useState<string | null>(null);

  const claimsQuery = useQuery({
    queryKey: ['claims', { page, filters }],
    queryFn: () =>
      listClaims({
        page,
        size: 10,
        search: filters.search,
        status: filters.status as ClaimStatus | '',
        categoryId: filters.categoryId ? Number(filters.categoryId) : '',
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['active-categories'],
    queryFn: listActiveCategories,
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'submit' | 'cancel' }) =>
      action === 'submit' ? submitClaim(id) : cancelClaim(id),
    onSuccess: async (_claim, variables) => {
      setNotice(variables.action === 'submit' ? 'Claim berhasil disubmit.' : 'Claim berhasil dibatalkan.');
      await queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
    onError: (error) => {
      setNotice(getApiErrorMessage(error, 'Action claim gagal.'));
    },
  });

  const claims = claimsQuery.data?.items ?? [];
  const totalPages = claimsQuery.data?.totalPages ?? 0;
  const categories = categoriesQuery.data ?? [];

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setFilters(draftFilters);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Claims</h1>
          <p className="mt-1 text-sm text-slate-500">Buat, submit, dan pantau klaim expense milikmu.</p>
        </div>
        <Button asChild>
          <Link to="/claims/new">
            <Plus size={16} />
            New Claim
          </Link>
        </Button>
      </div>

      {notice && (
        <div className="rounded-md border border-accent/20 bg-accentSoft px-4 py-3 text-sm font-medium text-accent">{notice}</div>
      )}

      <form className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]" onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <Input
            className="pl-10"
            value={draftFilters.search}
            onChange={(event) => setDraftFilters((value) => ({ ...value, search: event.target.value }))}
            placeholder="Search title"
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
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        <Table>
          <thead>
            <tr>
              <Th>Claim</Th>
              <Th>Category</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th className="w-12 text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id}>
                <Td>
                  <div className="font-medium">{claim.title}</div>
                  <div className="text-sm text-slate-500">{claim.description ?? '-'}</div>
                </Td>
                <Td>{claim.category.name}</Td>
                <Td>{formatCurrency(claim.amount)}</Td>
                <Td>{formatDate(claim.transactionDate)}</Td>
                <Td>
                  <StatusBadge status={claim.status} />
                </Td>
                <Td className="text-right">
                  <ActionMenu
                    items={[
                      {
                        label: 'Detail',
                        icon: <Eye size={15} />,
                        asChild: <Link to={`/claims/${claim.id}`} />,
                      },
                      ...(claim.status === 'DRAFT' || claim.status === 'REVISION_REQUESTED' || claim.status === 'REVISED'
                        ? [
                            {
                              label: 'Edit',
                              icon: <Edit size={15} />,
                              asChild: <Link to={`/claims/${claim.id}/edit`} />,
                            },
                          ]
                        : []),
                      ...(claim.status === 'DRAFT' || claim.status === 'REVISED'
                        ? [
                            {
                              label: 'Submit',
                              onClick: () => actionMutation.mutate({ id: claim.id, action: 'submit' }),
                            },
                          ]
                        : []),
                      ...(claim.status === 'DRAFT' ||
                      claim.status === 'SUBMITTED' ||
                      claim.status === 'REVISION_REQUESTED' ||
                      claim.status === 'REVISED'
                        ? [
                            {
                              label: 'Cancel',
                              danger: true,
                              onClick: () => actionMutation.mutate({ id: claim.id, action: 'cancel' }),
                            },
                          ]
                        : []),
                    ]}
                  />
                </Td>
              </tr>
            ))}
            {!claimsQuery.isLoading && claims.length === 0 && (
              <tr>
                <Td colSpan={6} className="text-center text-slate-500">
                  No claims found.
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
    </div>
  );
}
