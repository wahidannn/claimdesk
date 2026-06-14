import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-accent',
        className,
      )}
      {...props}
    />
  );
}
