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
        'h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition placeholder:text-mutedText/70 focus:border-accent focus:ring-2 focus:ring-accent/15',
        className,
      )}
      {...props}
    />
  );
});
