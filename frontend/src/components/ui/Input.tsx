import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded border border-border bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-blue-100',
        className,
      )}
      {...props}
    />
  );
});
