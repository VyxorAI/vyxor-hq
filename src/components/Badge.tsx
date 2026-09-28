import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'blue' | 'teal' | 'purple' | 'warning' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-raised text-muted',
  blue: 'bg-accent-blue/15 text-accent-blue',
  teal: 'bg-accent-teal/15 text-accent-teal',
  purple: 'bg-accent-purple/15 text-accent-purple',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-control px-1.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
