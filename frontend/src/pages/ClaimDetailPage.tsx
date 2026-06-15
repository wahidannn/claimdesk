import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, FileText, Trash2, Upload } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ClaimCommentsThread } from '../features/comments/ClaimCommentsThread';
import {
  cancelClaim,
  deleteAttachment,
  downloadAttachment,
  getClaim,
  listClaimAttachments,
  submitClaim,
  uploadClaimAttachment,
} from '../features/claims/api';
import { formatCurrency } from '../features/claims/currency';
import { StatusBadge } from '../features/claims/format';
import type { ExpenseAttachment } from '../features/claims/types';
import { getApiErrorMessage } from '../lib/api-error';

export function ClaimDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const claimId = Number(params.id);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const claimQuery = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => getClaim(claimId),
    enabled: Number.isFinite(claimId),
  });

  const actionMutation = useMutation({
    mutationFn: (action: 'submit' | 'cancel') => (action === 'submit' ? submitClaim(claimId) : cancelClaim(claimId)),
    onSuccess: async (claim) => {
      await queryClient.invalidateQueries({ queryKey: ['claims'] });
      await queryClient.invalidateQueries({ queryKey: ['claim', claimId] });
      navigate(`/claims/${claim.id}`, { replace: true });
    },
  });

  const attachmentsQuery = useQuery({
    queryKey: ['claim-attachments', claimId],
    queryFn: () => listClaimAttachments(claimId),
    enabled: Number.isFinite(claimId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadClaimAttachment(claimId, file),
    onSuccess: async () => {
      setAttachmentError(null);
      await queryClient.invalidateQueries({ queryKey: ['claim-attachments', claimId] });
    },
    onError: (error) => {
      setAttachmentError(getApiErrorMessage(error, 'Gagal upload receipt.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: number) => deleteAttachment(attachmentId),
    onSuccess: async () => {
      setAttachmentError(null);
      await queryClient.invalidateQueries({ queryKey: ['claim-attachments', claimId] });
    },
    onError: (error) => {
      setAttachmentError(getApiErrorMessage(error, 'Gagal menghapus receipt.'));
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
  const canEditClaim = claim?.status === 'DRAFT' || claim?.status === 'REVISION_REQUESTED' || claim?.status === 'REVISED';
  const canSubmitClaim = claim?.status === 'DRAFT' || claim?.status === 'REVISED';
  const canCancelClaim =
    claim?.status === 'DRAFT' ||
    claim?.status === 'SUBMITTED' ||
    claim?.status === 'REVISION_REQUESTED' ||
    claim?.status === 'REVISED';
  const canManageReceipts = canEditClaim;

  if (claimQuery.isLoading) {
    return <div className="text-sm text-slate-500">Loading claim...</div>;
  }

  if (!claim) {
    return <div className="text-sm text-slate-500">Claim not found.</div>;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    event.target.value = '';
  }

  return (
    <div className="max-w-4xl space-y-5">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/claims">
          <ArrowLeft size={16} />
          Back to claims
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2">
            <StatusBadge status={claim.status} />
          </div>
          <h1 className="text-2xl font-semibold">{claim.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{claim.category.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEditClaim && (
            <Button asChild variant="secondary">
              <Link to={`/claims/${claim.id}/edit`}>
                <Edit size={16} />
                {claim.status === 'REVISION_REQUESTED' ? 'Edit Revision' : 'Edit'}
              </Link>
            </Button>
          )}
          {canSubmitClaim && (
            <Button type="button" onClick={() => actionMutation.mutate('submit')}>
              Submit
            </Button>
          )}
          {canCancelClaim && (
            <Button type="button" variant="ghost" onClick={() => actionMutation.mutate('cancel')}>
              Cancel Claim
            </Button>
          )}
        </div>
      </div>

      {actionMutation.error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(actionMutation.error, 'Action claim gagal.')}
        </div>
      )}

      {claim.status === 'REVISION_REQUESTED' && claim.latestRevisionNote && (
        <section className="rounded border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-900">Revision requested</h2>
          <p className="mt-2 text-sm text-amber-800">{claim.latestRevisionNote}</p>
        </section>
      )}

      <section className="grid gap-4 rounded-lg border border-border bg-surface p-5 shadow-card sm:grid-cols-2">
        <DetailItem label="Amount" value={formatCurrency(claim.amount)} />
        <DetailItem label="Transaction Date" value={claim.transactionDate} />
        <DetailItem label="Submitted At" value={claim.submittedAt ?? '-'} />
        <DetailItem label="Created At" value={claim.createdAt} />
        <div className="sm:col-span-2">
          <DetailItem label="Description" value={claim.description ?? '-'} />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Receipts</h2>
            <p className="mt-1 text-sm text-slate-500">Upload JPG, PNG, atau PDF maksimal 5 MB untuk draft atau revision claim.</p>
          </div>
          {canManageReceipts && (
            <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#067A57]">
              <Upload size={16} />
              Upload Receipt
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                className="sr-only"
                onChange={handleFileChange}
                disabled={uploadMutation.isPending}
              />
            </label>
          )}
        </div>

        {attachmentError && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {attachmentError}
          </div>
        )}

        <div className="space-y-2">
          {(attachmentsQuery.data ?? []).map((attachment) => (
            <div
              key={attachment.id}
              className="flex flex-col gap-3 rounded-md border border-border px-4 py-3 transition hover:bg-accentSoft/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="shrink-0 text-slate-500" size={20} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {attachment.fileType} • {formatFileSize(attachment.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => downloadMutation.mutate(attachment)}
                  disabled={downloadMutation.isPending}
                >
                  View
                </Button>
                {canManageReceipts && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(attachment.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={15} />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!attachmentsQuery.isLoading && (attachmentsQuery.data ?? []).length === 0 && (
            <div className="rounded border border-dashed border-border px-4 py-6 text-center text-sm text-slate-500">
              No receipts uploaded.
            </div>
          )}
        </div>
      </section>

      <ClaimCommentsThread claimId={claim.id} />
    </div>
  );
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
