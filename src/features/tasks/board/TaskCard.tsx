import type { ComponentProps } from 'react';
import { DueDate } from '@/components/DueDate';
import type { Profile } from '@/features/auth/profiles';
import { OwnerAvatar } from '@/components/OwnerAvatar';
import { cn } from '@/lib/cn';
import { PriorityBadge } from '../components/PriorityBadge';
import type { Task } from '../types';

interface TaskCardProps extends ComponentProps<'div'> {
  task: Task;
  assignee: Profile | undefined;
  /** Secondary line, e.g. the client on the general board. */
  context?: string;
  lifted?: boolean;
}

export function TaskCard({ task, assignee, context, lifted = false, className, ...props }: TaskCardProps) {
  const done = task.status === 'done';
  const hasMeta = task.priority !== 'medium' || task.due_date;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-card border border-border bg-surface p-3 text-left transition-colors',
        'hover:border-accent-blue/50 hover:bg-raised/40',
        lifted && 'rotate-1 border-accent-blue/60 bg-raised shadow-overlay',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn('leading-snug font-medium break-words', done && 'text-muted line-through')}>{task.title}</p>
          {context && <p className="mt-0.5 truncate text-xs text-muted">{context}</p>}
        </div>
        <OwnerAvatar owner={assignee} emptyLabel="Unassigned" />
      </div>
      {hasMeta && (
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          <DueDate date={task.due_date} highlight={!done} />
        </div>
      )}
    </div>
  );
}
