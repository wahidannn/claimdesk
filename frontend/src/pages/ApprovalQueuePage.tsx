import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActionMenu } from '../components/ui/ActionMenu';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Table, Td, Th } from '../components/ui/Table';
import { Textarea } from '../components/ui/Textarea';
import { approveManagerClaim, listManagerClaims, rejectManagerClaim, requestClaimRevision } from '../features/approvals/api';
import { listActiveCategories } from '../features/claims/api';
import { formatCurrency } from '../features/claims/currency';
import { StatusBadge } from '../features/claims/format';
import type { ClaimStatus } from '../features/claims/types';
import { getApiErrorMessage } from '../lib/api-error';

type PendingAction = {
  id: number;
  title: string;
  action: 'approve' | 'reject' | 'revision';
};

export function ApprovalQueuePage() {
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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const claimsQuery = useQuery({
    queryKey: ['manager-claims', { page, filters }],
    queryFn: () =>
      listManagerClaims({
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
    mutationFn: ({ id, action, note }: PendingAction & { note: string }) =>
      action === 'approve'
        ? approveManagerClaim(id, { note })
        : action === 'revision'
          ? requestClaimRevision(id, { note })
          : rejectManagerClaim(id, { note }),
    onSuccess: async (_claim, variables) => {
      setNotice(
        variables.action === 'approve'
          ? 'Claim berhasil diapprove.'
          : variables.action === 'revision'
            ? 'Revision request berhasil dikirim.'
            : 'Claim berhasil direject.'
      );
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ['manager-claims'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
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

  function openModal(action: PendingAction) {
    setPendingAction(action);
    setNote('');
  }

  function closeModal() {
    setPendingAction(null);
    setNote('');
  }

  function submitAction() {
    if (!pendingAction) {
      return;
    }

    actionMutation.mutate({ ...pendingAction, note });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Approval Queue</h1>
        <p className="mt-1 text-sm text-slate-500">Review submitted claims dari department yang kamu pimpin.</p>
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
            placeholder="Search claim or employee"
          />
        </div>
        <Select
          value={draftFilters.status}
          onChange={(event) => setDraftFilters((value) => ({ ...value, status: event.target.value }))}
        >
          <option value="">Submitted</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="MANAGER_APPROVED">Manager approved</option>
          <option value="MANAGER_REJECTED">Manager rejected</option>
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
              <Th>Employee</Th>
              <Th>Category</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th className="w-12 text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id}>
                <Td>
                  <div className="font-medium">{claim.title}</div>
                  <div className="text-sm text-slate-500">{claim.transactionDate}</div>
                </Td>
                <Td>
                  <div className="font-medium">{claim.employee.name}</div>
                  <div className="text-sm text-slate-500">{claim.department?.name ?? '-'}</div>
                </Td>
                <Td>{claim.category.name}</Td>
                <Td>{formatCurrency(claim.amount)}</Td>
                <Td>
                  <StatusBadge status={claim.status} />
                </Td>
                <Td className="text-right">
                  <ActionMenu
                    items={[
                      {
                        label: 'Detail',
                        icon: <Eye size={15} />,
                        asChild: <Link to={`/approvals/${claim.id}`} />,
                      },
                      ...(claim.status === 'SUBMITTED'
                        ? [
                            {
                              label: 'Approve',
                              onClick: () => openModal({ id: claim.id, title: claim.title, action: 'approve' }),
                            },
                            {
                              label: 'Request Revision',
                              onClick: () => openModal({ id: claim.id, title: claim.title, action: 'revision' }),
                            },
                            {
                              label: 'Reject',
                              danger: true,
                              onClick: () => openModal({ id: claim.id, title: claim.title, action: 'reject' }),
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal
        open={pendingAction !== null}
        title={
          pendingAction?.action === 'reject'
            ? 'Reject Claim'
            : pendingAction?.action === 'revision'
              ? 'Request Revision'
              : 'Approve Claim'
        }
        onClose={closeModal}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{pendingAction?.title}</p>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={pendingAction?.action === 'approve' ? 'Optional note' : 'Note is required'}
          />
          {actionMutation.error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {getApiErrorMessage(actionMutation.error, 'Action approval gagal.')}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitAction}
              disabled={actionMutation.isPending || (pendingAction?.action !== 'approve' && !note.trim())}
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>
        Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
