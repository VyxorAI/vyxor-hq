import { DueDate } from '@/components/DueDate';
import { OwnerAvatar } from '@/components/OwnerAvatar';
import type { Profile } from '@/features/auth/profiles';
import { cn } from '@/lib/cn';
import type { Task, TaskStatus } from '../types';
import { PriorityBadge } from './PriorityBadge';

interface TaskRowProps {
  task: Task;
  assignee?: Profile;
  context?: string;
  showAssignee?: boolean;
  onOpen: (id: string) => void;
  onSetStatus: (id: string, status: TaskStatus) => void;
}

/** List row with a done checkbox. Used by My week and the client Tasks tab. */
export function TaskRow({ task, assignee, context, showAssignee = true, onOpen, onSetStatus }: TaskRowProps) {
  const done = task.status === 'done';

  return (
    <li className="flex items-center gap-3 border-b border-border px-3 py-2.5 transition-colors last:border-b-0 hover:bg-raised">
      <input
        type="checkbox"
        checked={done}
        onChange={() => onSetStatus(task.id, done ? 'todo' : 'done')}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        className="size-4 shrink-0 cursor-pointer accent-accent-teal"
      />
      <button type="button" onClick={() => onOpen(task.id)} className="min-w-0 flex-1 text-left">
        <span className={cn('block truncate font-medium hover:text-accent-blue', done && 'text-muted line-through')}>
          {task.title}
        </span>
        {context && <span className="block truncate text-xs text-muted">{context}</span>}
      </button>
      <div className="flex shrink-0 items-center gap-2">
        {task.status === 'doing' && <span className="hidden text-xs text-accent-blue sm:inline">Doing</span>}
        <PriorityBadge priority={task.priority} />
        <DueDate date={task.due_date} highlight={!done} />
        {showAssignee && <OwnerAvatar owner={assignee} emptyLabel="Unassigned" />}
      </div>
    </li>
  );
}
