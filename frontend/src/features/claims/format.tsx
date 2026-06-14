import { Badge } from '../../components/ui/Badge';
import type { ClaimStatus } from './types';

export function StatusBadge({ status }: { status: ClaimStatus }) {
  const muted = status === 'CANCELLED' || status.includes('REJECTED');

  return (
    <Badge className={muted ? 'border-slate-200 bg-slate-100 text-slate-600' : undefined}>
      {status.split('_').join(' ')}
    </Badge>
  );
}
