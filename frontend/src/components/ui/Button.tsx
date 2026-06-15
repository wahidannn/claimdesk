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
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
  children?: ReactNode;
};

export function Button({ asChild = false, className, variant = 'primary', children, ...props }: ButtonProps) {
  const buttonClassName = cn(
    'inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/25 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'primary' && 'bg-accent text-white shadow-sm hover:bg-[#067A57]',
    variant === 'secondary' && 'border border-border bg-surface text-ink hover:border-accent/30 hover:bg-accentSoft',
    variant === 'ghost' && 'text-mutedText hover:bg-accentSoft hover:text-accent',
    variant === 'danger' && 'border border-red-200 bg-red-50 text-red-700 shadow-sm hover:bg-red-100',
    variant === 'warning' && 'border border-amber-200 bg-amber-50 text-amber-800 shadow-sm hover:bg-amber-100',
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
