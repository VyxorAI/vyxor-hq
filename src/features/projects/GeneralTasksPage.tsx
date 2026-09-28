import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { useCurrentProfile } from '@/features/auth/profiles';
import { useClients } from '@/features/clients/api';
import { useTasks } from '@/features/tasks/api';
import { TaskBoard } from '@/features/tasks/board/TaskBoard';
import { TaskDrawerHost, useTaskDrawerLinks } from '@/features/tasks/TaskDrawerHost';
import type { Task } from '@/features/tasks/types';

/** /projects/general: board for tasks that aren't in a project. */
export function GeneralTasksPage() {
  const currentProfile = useCurrentProfile();
  const { data: tasks, isPending, error, refetch } = useTasks();
  const { data: clients = [] } = useClients();
  const { openTask, openNewTask } = useTaskDrawerLinks();

  const clientNames = new Map(clients.map((client) => [client.id, client.business_name]));
  const contextFor = (task: Task) => (task.client_id ? clientNames.get(task.client_id) : undefined);

  let content;
  if (isPending) {
    content = (
      <div className="flex justify-center py-20">
        <Spinner label="Loading tasks" />
      </div>
    );
  } else if (!tasks) {
    content = (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load tasks"
        description={error?.message}
        action={<Button onClick={() => void refetch()}>Try again</Button>}
      />
    );
  } else {
    content = (
      <TaskBoard
        tasks={tasks.filter((task) => !task.project_id)}
        projectId={null}
        onOpenTask={openTask}
        contextFor={contextFor}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link to="/projects" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-primary">
          <ArrowLeft className="size-4" aria-hidden />
          Projects
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl">General tasks</h2>
            <p className="text-muted">Agency work that isn't part of a project. Client-only tasks show their client.</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={openNewTask}>
            Add task
          </Button>
        </div>
      </div>

      {content}

      <TaskDrawerHost defaults={{ assigneeId: currentProfile?.id }} />
    </div>
  );
}
