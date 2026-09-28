import { useToast } from '@/components/Toast';
import { useSetTaskStatus } from '@/features/tasks/api';
import { TaskRow } from '@/features/tasks/components/TaskRow';
import { byPosition } from '@/features/tasks/ordering';
import { useTaskDrawerLinks } from '@/features/tasks/TaskDrawerHost';
import type { Task, TaskStatus } from '@/features/tasks/types';
import { useTaskContext } from '@/features/tasks/useTaskContext';
import { addDaysISO, todayISO } from '@/lib/format';
import { CardEmpty, HomeCard } from './HomeCard';

const SHOWN = 6;

/** My open tasks due in the next 7 days (and overdue), soonest first. */
export function MyTasksCard({ tasks, profileId }: { tasks: Task[]; profileId: string | undefined }) {
  const toast = useToast();
  const setTaskStatus = useSetTaskStatus();
  const contextOf = useTaskContext();
  const { openTask } = useTaskDrawerLinks();

  const weekEnd = addDaysISO(todayISO(), 6);
  const mine = tasks
    .filter(
      (task) =>
        task.assignee_id === profileId && task.status !== 'done' && task.due_date !== null && task.due_date <= weekEnd,
    )
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? '') || byPosition(a, b));

  function setStatus(id: string, status: TaskStatus) {
    setTaskStatus(id, status);
    if (status === 'done') toast.success('Task marked as done.');
  }

  return (
    <HomeCard id="home-my-tasks" title="My tasks this week" count={mine.length} link={{ to: '/my-week', label: 'My week' }}>
      {mine.length === 0 ? (
        <CardEmpty>Nothing due this week.</CardEmpty>
      ) : (
        <ul>
          {mine.slice(0, SHOWN).map((task) => (
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
      )}
    </HomeCard>
  );
}
