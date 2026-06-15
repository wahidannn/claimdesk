import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { getApiErrorMessage } from '../../lib/api-error';
import { createClaimComment, listClaimComments } from './api';

export function ClaimCommentsThread({ claimId }: { claimId: number }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const commentsQuery = useQuery({
    queryKey: ['claim-comments', claimId],
    queryFn: () => listClaimComments(claimId),
    enabled: Number.isFinite(claimId),
  });

  const createMutation = useMutation({
    mutationFn: () => createClaimComment(claimId, { message }),
    onSuccess: async () => {
      setMessage('');
      await queryClient.invalidateQueries({ queryKey: ['claim-comments', claimId] });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    createMutation.mutate();
  }

  const comments = commentsQuery.data ?? [];

  return (
    <section className="space-y-4 rounded border border-border bg-surface p-5">
      <div>
        <h2 className="text-lg font-semibold">Comments</h2>
        <p className="mt-1 text-sm text-slate-500">Diskusi internal untuk claim ini.</p>
      </div>

      <div className="space-y-3">
        {commentsQuery.isLoading && <div className="text-sm text-slate-500">Loading comments...</div>}

        {!commentsQuery.isLoading && comments.length === 0 && (
          <div className="rounded border border-dashed border-border px-4 py-6 text-center text-sm text-slate-500">
            No comments yet.
          </div>
        )}

        {comments.map((comment) => (
          <article key={comment.id} className="rounded border border-border px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{comment.author.name}</span>
                  <Badge className={roleBadgeClass(comment.author.role)}>{comment.author.role}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">{comment.author.email}</p>
              </div>
              <time className="text-xs text-slate-400">{comment.createdAt}</time>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.message}</p>
          </article>
        ))}
      </div>

      {commentsQuery.error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(commentsQuery.error, 'Gagal memuat comments.')}
        </div>
      )}

      <form className="space-y-3 border-t border-border pt-4" onSubmit={handleSubmit}>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write a comment..."
          maxLength={2000}
        />
        {createMutation.error && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getApiErrorMessage(createMutation.error, 'Gagal mengirim comment.')}
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">{message.length}/2000</span>
          <Button type="submit" disabled={!message.trim() || createMutation.isPending}>
            Post Comment
          </Button>
        </div>
      </form>
    </section>
  );
}

function roleBadgeClass(role: string) {
  if (role === 'ADMIN') {
    return 'border-slate-200 bg-slate-50 text-slate-700';
  }

  if (role === 'MANAGER') {
    return 'border-teal-200 bg-teal-50 text-teal-700';
  }

  if (role === 'FINANCE') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-blue-200 bg-blue-50 text-blue-700';
}
