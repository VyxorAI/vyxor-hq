import { useState, type FormEvent } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useCurrentProfile } from '@/features/auth/profiles';
import { errorMessage } from '@/lib/errors';
import { useCreateTask } from '../api';

interface QuickAddTaskProps {
  projectId: string | null;
  clientId?: string | null;
}

/** Type a title, press Enter: adds a to-do assigned to you at the bottom of To do. */
export function QuickAddTask({ projectId, clientId = null }: QuickAddTaskProps) {
  const toast = useToast();
  const currentProfile = useCurrentProfile();
  const createTask = useCreateTask();
  const [title, setTitle] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || createTask.isPending) return;
    createTask.mutate(
      {
        title: trimmed,
        status: 'todo',
        project_id: projectId,
        client_id: projectId ? null : clientId,
        assignee_id: currentProfile?.id ?? null,
      },
      {
        onSuccess: () => setTitle(''),
        onError: (error) => toast.error(`Couldn't add the task. ${errorMessage(error)}`),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      {createTask.isPending ? (
        <Loader2 className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 animate-spin text-muted" aria-hidden />
      ) : (
        <Plus className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
      )}
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a task"
        aria-label="New task title, press Enter to add"
        className="h-9 w-full rounded-control border border-transparent bg-transparent pr-3 pl-8 text-sm text-primary hover:bg-raised/60 focus:border-accent-blue focus:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
      />
    </form>
  );
}
