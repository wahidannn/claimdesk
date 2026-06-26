import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type SpinnerProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <Loader2
      aria-hidden="true"
      className={cn('animate-spin text-accent', sizeClasses[size], className)}
    />
  );
}

export function LoadingState({ label = 'Loading data...', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 text-sm font-medium text-mutedText', className)}>
      <Spinner size="sm" />
      <span>{label}</span>
    </div>
  );
}
