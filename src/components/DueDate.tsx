import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { dueState, formatShortDate } from '@/lib/format';

const stateClass = {
  overdue: 'text-danger',
  today: 'text-warning',
  upcoming: 'text-muted',
} as const;

const stateLabel = {
  overdue: 'Overdue',
  today: 'Due today',
  upcoming: 'Due',
} as const;

interface DueDateProps {
  date: string | null;
  /** Colour today amber and past dates red. Off for finished work. */
  highlight?: boolean;
  /** Screen reader prefix for upcoming dates, e.g. "Follow up". */
  label?: string;
}

export function DueDate({ date, highlight = true, label }: DueDateProps) {
  if (!date) return null;
  const state = highlight ? dueState(date) : 'upcoming';
  const text = state === 'upcoming' ? (label ?? stateLabel.upcoming) : stateLabel[state];

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap tabular-nums', stateClass[state])}
      title={`${text}: ${formatShortDate(date)}`}
    >
      <CalendarClock className="size-3.5" aria-hidden />
      <span className="sr-only">{text}:</span>
      {state === 'today' ? 'Today' : formatShortDate(date)}
    </span>
  );
}
