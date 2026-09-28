import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface StatTileProps {
  label: string;
  value: string;
  /** Supporting line, e.g. "3 invoices · 1 overdue". */
  hint?: ReactNode;
  className?: string;
}

/** A single headline number. Label in sentence case, value in the display face. */
export function StatTile({ label, value, hint, className }: StatTileProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1 rounded-card border border-border bg-surface p-4', className)}>
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className="truncate font-display text-xl font-semibold tabular-nums">{value}</span>
      {hint && <span className="truncate text-xs text-muted">{hint}</span>}
    </div>
  );
}
