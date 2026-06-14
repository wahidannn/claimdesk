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
        'rounded border bg-surface p-4 shadow-sm',
        variant === 'success' && 'border-green-200',
        variant === 'error' && 'border-red-200',
        variant === 'info' && 'border-border',
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      {description && <div className="mt-1 text-sm text-slate-600">{description}</div>}
    </div>
  );
}
