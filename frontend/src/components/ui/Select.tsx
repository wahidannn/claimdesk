import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded border border-border bg-white px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-blue-100',
        className,
      )}
      {...props}
    />
  );
});
