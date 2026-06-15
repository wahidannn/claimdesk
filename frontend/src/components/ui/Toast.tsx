import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type ToastProps = {
  title: string;
  description?: ReactNode;
  variant?: 'success' | 'error' | 'info';
};

export function Toast({ title, description, variant = 'info' }: ToastProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-surface p-4 shadow-card',
        variant === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
        variant === 'error' && 'border-red-200 bg-red-50 text-red-800',
        variant === 'info' && 'border-border text-ink',
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      {description && <div className="mt-1 text-sm text-mutedText">{description}</div>}
    </div>
  );
}
