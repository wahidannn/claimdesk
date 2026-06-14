import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-28 w-full rounded border border-border bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-blue-100',
        className,
      )}
      {...props}
    />
  );
});
