import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { approveManagerClaim, getManagerClaim, rejectManagerClaim, requestClaimRevision } from '../features/approvals/api';
import type { ReviewClaim } from '../features/approvals/types';
import { ClaimCommentsThread } from '../features/comments/ClaimCommentsThread';
import { downloadAttachment } from '../features/claims/api';
import { formatCurrency } from '../features/claims/currency';
import { StatusBadge } from '../features/claims/format';
import type { ExpenseAttachment } from '../features/claims/types';
import { approveFinanceClaim, getFinanceClaim, markClaimPaid } from '../features/finance-review/api';
import { getApiErrorMessage } from '../lib/api-error';
import { formatDate, formatDateTime } from '../lib/date-format';

type ReviewMode = 'manager' | 'finance';
type PendingAction = 'manager-approve' | 'manager-reject' | 'manager-revision' | 'finance-approve' | 'mark-paid';

export function ReviewDetailPage({ mode }: { mode: ReviewMode }) {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const claimId = Number(params.id);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [note, setNote] = useState('');
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const claimQuery = useQuery({
    queryKey: [mode === 'manager' ? 'manager-claim' : 'finance-claim', claimId],
    queryFn: () => (mode === 'manager' ? getManagerClaim(claimId) : getFinanceClaim(claimId)),
    enabled: Number.isFinite(claimId),
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, note }: { action: PendingAction; note: string }) => runAction(action, claimId, note),
    onSuccess: async (claim) => {
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ['manager-claims'] });
      await queryClient.invalidateQueries({ queryKey: ['finance-claims'] });
      await queryClient.invalidateQueries({ queryKey: ['manager-claim', claimId] });
      await queryClient.invalidateQueries({ queryKey: ['finance-claim', claimId] });
      navigate(mode === 'manager' ? `/approvals/${claim.id}` : `/finance-review/${claim.id}`, { replace: true });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (attachment: ExpenseAttachment) => downloadAttachment(attachment.id),
    onSuccess: (blob) => {
      const objectUrl = window.URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 30_000);
      setAttachmentError(null);
    },
    onError: (error) => {
      setAttachmentError(getApiErrorMessage(error, 'Gagal membuka receipt.'));
    },
  });

  const claim = claimQuery.data;
  const backPath = mode === 'manager' ? '/approvals' : '/finance-review';

  if (claimQuery.isLoading) {
    return <div className="text-sm text-slate-500">Loading claim...</div>;
  }

  if (!claim) {
    return <div className="text-sm text-slate-500">Claim not found.</div>;
  }

  function closeModal() {
    setPendingAction(null);
    setNote('');
  }

  function submitAction() {
    if (!pendingAction) {
      return;
    }

    actionMutation.mutate({ action: pendingAction, note });
  }

  return (
    <div className="max-w-5xl space-y-5">
      <Button asChild variant="ghost" className="px-0">
        <Link to={backPath}>
          <ArrowLeft size={16} />
          Back to review
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2">
            <StatusBadge status={claim.status} />
          </div>
          <h1 className="text-2xl font-semibold">{claim.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {claim.employee.name} {claim.department ? `- ${claim.department.name}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === 'manager' && claim.status === 'SUBMITTED' && (
            <>
              <Button type="button" onClick={() => setPendingAction('manager-approve')}>
                Approve
              </Button>
              <Button type="button" variant="danger" onClick={() => setPendingAction('manager-reject')}>
                Reject
              </Button>
              <Button type="button" variant="warning" onClick={() => setPendingAction('manager-revision')}>
                Request Revision
              </Button>
            </>
          )}
          {mode === 'finance' && claim.status === 'MANAGER_APPROVED' && (
            <Button type="button" onClick={() => setPendingAction('finance-approve')}>
              Finance Approve
            </Button>
          )}
          {mode === 'finance' && claim.status === 'FINANCE_APPROVED' && (
            <Button type="button" onClick={() => setPendingAction('mark-paid')}>
              Mark Paid
            </Button>
          )}
        </div>
      </div>

      <section className="grid gap-4 rounded-lg border border-border bg-surface p-5 shadow-card sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem label="Amount" value={formatCurrency(claim.amount)} />
        <DetailItem label="Category" value={claim.category.name} />
        <DetailItem label="Transaction Date" value={formatDate(claim.transactionDate)} />
        <DetailItem label="Employee Email" value={claim.employee.email} />
        <DetailItem label="Submitted At" value={formatDateTime(claim.submittedAt)} />
        <DetailItem label="Manager Reviewed At" value={formatDateTime(claim.managerReviewedAt)} />
        <DetailItem label="Finance Reviewed At" value={formatDateTime(claim.financeReviewedAt)} />
        <DetailItem label="Paid At" value={formatDateTime(claim.paidAt)} />
        <DetailItem label="Created At" value={formatDateTime(claim.createdAt)} />
        <div className="sm:col-span-2 lg:col-span-3">
          <DetailItem label="Description" value={claim.description ?? '-'} />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-surface p-5 shadow-card">
        <div>
          <h2 className="text-lg font-semibold">Receipts</h2>
          <p className="mt-1 text-sm text-slate-500">Receipt yang diupload employee untuk claim ini.</p>
        </div>

        {attachmentError && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {attachmentError}
          </div>
        )}

        <div className="space-y-2">
          {claim.attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex flex-col gap-3 rounded-md border border-border px-4 py-3 transition hover:bg-accentSoft/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="shrink-0 text-slate-500" size={20} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {attachment.fileType} - {formatFileSize(attachment.fileSize)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => downloadMutation.mutate(attachment)}
                disabled={downloadMutation.isPending}
              >
                View
              </Button>
            </div>
          ))}
          {claim.attachments.length === 0 && (
            <div className="rounded border border-dashed border-border px-4 py-6 text-center text-sm text-slate-500">
              No receipts uploaded.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-surface p-5 shadow-card">
        <div>
          <h2 className="text-lg font-semibold">Approval History</h2>
          <p className="mt-1 text-sm text-slate-500">Catatan keputusan approval untuk claim ini.</p>
        </div>
        <div className="space-y-3">
          {claim.approvalNotes.map((approvalNote) => (
            <div key={approvalNote.id} className="rounded-md border border-border px-4 py-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-medium">{approvalNote.action.split('_').join(' ')}</div>
                <div className="text-sm text-slate-500">{formatDateTime(approvalNote.createdAt)}</div>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {approvalNote.reviewer.name} ({approvalNote.reviewer.role})
              </p>
              {approvalNote.note && <p className="mt-2 text-sm text-ink">{approvalNote.note}</p>}
            </div>
          ))}
          {claim.approvalNotes.length === 0 && (
            <div className="rounded border border-dashed border-border px-4 py-6 text-center text-sm text-slate-500">
              No approval history yet.
            </div>
          )}
        </div>
      </section>

      <ClaimCommentsThread claimId={claim.id} />

      <Modal open={pendingAction !== null} title={modalTitle(pendingAction)} onClose={closeModal}>
        <div className="space-y-4">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              pendingAction === 'manager-reject'
                ? 'Reject note is required'
                : pendingAction === 'manager-revision'
                  ? 'Revision note is required'
                  : 'Optional note'
            }
          />
          {actionMutation.error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {getApiErrorMessage(actionMutation.error, 'Action review gagal.')}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitAction}
              disabled={
                actionMutation.isPending ||
                ((pendingAction === 'manager-reject' || pendingAction === 'manager-revision') && !note.trim())
              }
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function runAction(action: PendingAction, claimId: number, note: string): Promise<ReviewClaim> {
  if (action === 'manager-approve') {
    return approveManagerClaim(claimId, { note });
  }

  if (action === 'manager-reject') {
    return rejectManagerClaim(claimId, { note });
  }

  if (action === 'manager-revision') {
    return requestClaimRevision(claimId, { note });
  }

  if (action === 'finance-approve') {
    return approveFinanceClaim(claimId, { note });
  }

  return markClaimPaid(claimId, { note });
}

function modalTitle(action: PendingAction | null) {
  if (action === 'manager-reject') {
    return 'Reject Claim';
  }

  if (action === 'manager-revision') {
    return 'Request Revision';
  }

  if (action === 'finance-approve') {
    return 'Finance Approve Claim';
  }

  if (action === 'mark-paid') {
    return 'Mark Claim Paid';
  }

  return 'Approve Claim';
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-ink">{value}</p>
    </div>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
