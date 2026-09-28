import { AlertCircle, CalendarCheck, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { useCurrentProfile, useProfiles } from '@/features/auth/profiles';
import { addDaysISO, formatDayHeading, todayISO } from '@/lib/format';
import { useSetTaskStatus, useTasks } from './api';
import { TaskRow } from './components/TaskRow';
import { byPosition } from './ordering';
import { TaskDrawerHost, useTaskDrawerLinks } from './TaskDrawerHost';
import type { Task, TaskStatus } from './types';
import { useTaskContext } from './useTaskContext';

interface DayGroup {
  key: string;
  heading: string;
  tone?: 'danger';
  tasks: Task[];
}

/** Open tasks for me: overdue, then each of the next 7 days. */
function groupByDay(tasks: Task[]): DayGroup[] {
  const today = todayISO();
  const groups: DayGroup[] = [
    { key: 'overdue', heading: 'Overdue', tone: 'danger', tasks: tasks.filter((task) => task.due_date! < today) },
  ];
  for (let offset = 0; offset < 7; offset++) {
    const day = addDaysISO(today, offset);
    groups.push({ key: day, heading: formatDayHeading(day), tasks: tasks.filter((task) => task.due_date === day) });
  }
  return groups
    .map((group) => ({
      ...group,
      tasks: [...group.tasks].sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? '') || byPosition(a, b)),
    }))
    .filter((group) => group.tasks.length > 0);
}

export function MyWeekPage() {
  const toast = useToast();
  const currentProfile = useCurrentProfile();
  const { isPending: profilesPending } = useProfiles();
  const { data: tasks, isPending, error, refetch } = useTasks();
  const setTaskStatus = useSetTaskStatus();

  function setStatus(id: string, status: TaskStatus) {
    setTaskStatus(id, status);
    if (status === 'done') toast.success('Task marked as done.');
  }
  const contextOf = useTaskContext();
  const { openTask, openNewTask } = useTaskDrawerLinks();

  const weekEnd = addDaysISO(todayISO(), 6);
  const mine = (tasks ?? []).filter(
    (task) =>
      task.assignee_id === currentProfile?.id &&
      task.status !== 'done' &&
      task.due_date !== null &&
      task.due_date <= weekEnd,
  );
  const groups = groupByDay(mine);
  const undatedCount = (tasks ?? []).filter(
    (task) => task.assignee_id === currentProfile?.id && task.status !== 'done' && task.due_date === null,
  ).length;

  let content;
  if (isPending || profilesPending) {
    content = (
      <div className="flex justify-center py-20">
        <Spinner label="Loading your week" />
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
  } else if (groups.length === 0) {
    content = (
      <EmptyState
        icon={CalendarCheck}
        title="Nothing due this week"
        description="Tasks assigned to you with a due date in the next 7 days show up here."
        action={
          <Button variant="primary" icon={Plus} onClick={openNewTask}>
            Add task
          </Button>
        }
      />
    );
  } else {
    content = (
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`day-${group.key}`} className="flex flex-col gap-2">
            <h2
              id={`day-${group.key}`}
              className={group.tone === 'danger' ? 'text-sm text-danger' : 'text-sm text-primary'}
            >
              {group.heading}
              <span className="ml-2 font-sans text-xs font-normal text-muted tabular-nums">{group.tasks.length}</span>
            </h2>
            <ul className="overflow-hidden rounded-card border border-border bg-surface">
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  context={contextOf(task)}
                  showAssignee={false}
                  onOpen={openTask}
                  onSetStatus={setStatus}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {mine.length === 1 ? '1 open task' : `${mine.length} open tasks`} due by {formatDayHeading(weekEnd)}
          {undatedCount > 0 && ` · ${undatedCount} without a due date`}
        </p>
        <Button icon={Plus} onClick={openNewTask}>
          Add task
        </Button>
      </div>
      {content}
      <TaskDrawerHost defaults={{ assigneeId: currentProfile?.id, dueDate: todayISO() }} />
    </div>
  );
}
