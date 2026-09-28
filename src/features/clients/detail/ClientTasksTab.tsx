import { ListChecks, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useCurrentProfile, useProfileMap } from '@/features/auth/profiles';
import { useProjectMap } from '@/features/projects/api';
import { useSetTaskStatus, useTasks } from '@/features/tasks/api';
import { TaskRow } from '@/features/tasks/components/TaskRow';
import { TASK_STATUSES } from '@/features/tasks/constants';
import { byPosition } from '@/features/tasks/ordering';
import { TaskDrawerHost, useTaskDrawerLinks } from '@/features/tasks/TaskDrawerHost';
import type { Client } from '../types';

/** Every task for this client (in its projects or directly), grouped by status. */
export function ClientTasksTab({ client }: { client: Client }) {
  const currentProfile = useCurrentProfile();
  const profiles = useProfileMap();
  const projects = useProjectMap();
  const { data: tasks = [] } = useTasks();
  const setStatus = useSetTaskStatus();
  const { openTask, openNewTask } = useTaskDrawerLinks();

  const clientTasks = tasks.filter((task) => task.client_id === client.id);

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      {clientTasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks for this client yet"
          description="Add one here, or on one of the client's project boards."
          action={
            <Button variant="primary" icon={Plus} onClick={openNewTask}>
              Add task
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex justify-end">
            <Button icon={Plus} onClick={openNewTask}>
              Add task
            </Button>
          </div>
          {TASK_STATUSES.map((status) => {
            const group = clientTasks.filter((task) => task.status === status.value).sort(byPosition);
            if (group.length === 0) return null;
            return (
              <section key={status.value} aria-labelledby={`tasks-${status.value}`} className="flex flex-col gap-2">
                <h3 id={`tasks-${status.value}`} className="text-sm">
                  {status.label}
                  <span className="ml-2 font-sans text-xs font-normal text-muted tabular-nums">{group.length}</span>
                </h3>
                <ul className="overflow-hidden rounded-card border border-border bg-surface">
                  {group.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      assignee={task.assignee_id ? profiles.get(task.assignee_id) : undefined}
                      context={task.project_id ? projects.get(task.project_id)?.name : 'No project'}
                      onOpen={openTask}
                      onSetStatus={setStatus}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}

      <TaskDrawerHost defaults={{ clientId: client.id, assigneeId: currentProfile?.id }} />
    </div>
  );
}
