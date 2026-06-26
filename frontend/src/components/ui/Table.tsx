import type { TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { LoadingState } from './Spinner';

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="app-scrollbar w-full overflow-x-auto">
      <table
        className={cn(
          'w-full border-collapse text-left text-sm leading-5 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-accentSoft/45 [&_tbody_tr:last-child_td]:border-b-0',
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'border-b border-border bg-sidebar/70 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-mutedText',
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-border px-4 py-2.5 align-middle text-ink', className)} {...props} />;
}

export function TableLoadingRow({ colSpan, label = 'Loading data...' }: { colSpan: number; label?: string }) {
  return (
    <tr>
      <Td colSpan={colSpan} className="py-7">
        <LoadingState label={label} />
      </Td>
    </tr>
  );
}
