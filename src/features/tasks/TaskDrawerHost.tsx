import { useCallback } from 'react';
import { useUpdateParams } from '@/lib/useUpdateParams';
import { useTasks } from './api';
import type { TaskDefaults } from './form/taskFormModel';
import { TaskDrawer } from './TaskDrawer';

/** Open the task drawer through the URL: `task=<id>` to edit, `newTask=1` to add. */
export function useTaskDrawerLinks() {
  const [, updateParams] = useUpdateParams();

  const openTask = useCallback(
    (id: string) =>
      updateParams((p) => {
        p.delete('newTask');
        p.set('task', id);
      }),
    [updateParams],
  );
  const openNewTask = useCallback(
    () =>
      updateParams((p) => {
        p.delete('task');
        p.set('newTask', '1');
      }),
    [updateParams],
  );

  return { openTask, openNewTask };
}

/** Renders the task drawer when the URL asks for it. `defaults` pre-fill new tasks for this page. */
export function TaskDrawerHost({ defaults }: { defaults?: TaskDefaults }) {
  const [params, updateParams] = useUpdateParams();
  const { data: tasks } = useTasks();

  const taskId = params.get('task');
  const creating = params.get('newTask') === '1';
  const task = taskId ? tasks?.find((item) => item.id === taskId) : undefined;

  const close = () =>
    updateParams((p) => {
      p.delete('task');
      p.delete('newTask');
    }, true);

  if (creating) return <TaskDrawer key="new" task={undefined} defaults={defaults} onClose={close} />;
  if (task) return <TaskDrawer key={task.id} task={task} onClose={close} />;
  return null;
}
