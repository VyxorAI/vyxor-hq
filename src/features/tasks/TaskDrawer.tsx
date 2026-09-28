import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, IconButton } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { errorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { useFormState } from '@/lib/useFormState';
import { useCreateTask, useDeleteTask, useUpdateTask } from './api';
import { TaskForm } from './form/TaskForm';
import { toTaskFormValues, toTaskPayload, validateTask, type TaskDefaults } from './form/taskFormModel';
import type { Task } from './types';

const FORM_ID = 'task-form';

interface TaskDrawerProps {
  /** Undefined when adding a new task. */
  task: Task | undefined;
  defaults?: TaskDefaults;
  onClose: () => void;
}

export function TaskDrawer({ task, defaults, onClose }: TaskDrawerProps) {
  const toast = useToast();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const form = useFormState(() => toTaskFormValues(task, defaults), validateTask);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saving = createTask.isPending || updateTask.isPending;

  function save() {
    const values = form.check();
    if (!values) return;
    const payload = toTaskPayload(values);
    const callbacks = {
      onSuccess: () => {
        toast.success(task ? 'Changes saved.' : 'Task added.');
        onClose();
      },
      onError: (error: unknown) => toast.error(`Couldn't save the task. ${errorMessage(error)}`),
    };
    if (task) updateTask.mutate({ id: task.id, changes: payload }, callbacks);
    else createTask.mutate(payload, callbacks);
  }

  function handleDelete() {
    if (!task) return;
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success('Task deleted.');
        setConfirmDelete(false);
        onClose();
      },
      onError: (error) => toast.error(`Couldn't delete the task. ${errorMessage(error)}`),
    });
  }

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        title={task ? task.title : 'New task'}
        subtitle={task && <p className="text-xs text-muted">Added {formatDate(task.created_at)}</p>}
        footer={
          <>
            {task && (
              <IconButton
                icon={Trash2}
                label="Delete task"
                onClick={() => setConfirmDelete(true)}
                className="hover:bg-danger/15 hover:text-danger"
              />
            )}
            <div className="ml-auto flex gap-2">
              <Button onClick={onClose}>Cancel</Button>
              <Button type="submit" form={FORM_ID} variant="primary" loading={saving}>
                {task ? 'Save changes' : 'Add task'}
              </Button>
            </div>
          </>
        }
      >
        <TaskForm id={FORM_ID} values={form.values} errors={form.errors} onChange={form.change} onSubmit={save} />
      </Drawer>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this task?"
        description={`This permanently removes "${task?.title ?? ''}". It can't be undone.`}
        footer={
          <>
            <Button onClick={() => setConfirmDelete(false)}>Keep task</Button>
            <Button variant="danger" icon={Trash2} loading={deleteTask.isPending} onClick={handleDelete}>
              Delete task
            </Button>
          </>
        }
      />
    </>
  );
}
