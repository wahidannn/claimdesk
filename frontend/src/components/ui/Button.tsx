import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  children?: ReactNode;
};

export function Button({ asChild = false, className, variant = 'primary', children, ...props }: ButtonProps) {
  const buttonClassName = cn(
    'inline-flex h-10 items-center justify-center gap-2 rounded px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'primary' && 'bg-accent text-white hover:bg-blue-700',
    variant === 'secondary' && 'border border-border bg-surface text-ink hover:bg-muted',
    variant === 'ghost' && 'text-slate-600 hover:bg-muted hover:text-ink',
    className,
  );

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;

    return cloneElement(child, {
      className: cn(buttonClassName, child.props.className),
    });
  }

  return (
    <button
      className={buttonClassName}
      {...props}
    >
      {children}
    </button>
  );
}
