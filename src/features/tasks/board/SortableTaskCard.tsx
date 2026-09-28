import { useSortableCard } from '@/components/kanban/useSortableCard';
import type { Profile } from '@/features/auth/profiles';
import { cn } from '@/lib/cn';
import type { Task } from '../types';
import { TaskCard } from './TaskCard';

interface SortableTaskCardProps {
  task: Task;
  assignee: Profile | undefined;
  context?: string;
  onOpen: (id: string) => void;
}

export function SortableTaskCard({ task, assignee, context, onOpen }: SortableTaskCardProps) {
  const { isDragging, props } = useSortableCard(task.id, task.title, onOpen);

  return (
    <TaskCard
      task={task}
      assignee={assignee}
      context={context}
      className={cn('cursor-grab select-none active:cursor-grabbing', isDragging && 'opacity-40')}
      {...props}
    />
  );
}
