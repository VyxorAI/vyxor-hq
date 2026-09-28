import { orNull } from '@/lib/validation';
import type { Task, TaskPayload, TaskPriority, TaskStatus } from '../types';

export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string;
  due_date: string;
  project_id: string;
  client_id: string;
}

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>;

/** Pre-set fields for a new task, depending on where it's added from. */
export interface TaskDefaults {
  projectId?: string;
  clientId?: string;
  assigneeId?: string;
  dueDate?: string;
  status?: TaskStatus;
}

export function toTaskFormValues(task: Task | undefined, defaults: TaskDefaults = {}): TaskFormValues {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? defaults.status ?? 'todo',
    priority: task?.priority ?? 'medium',
    assignee_id: task ? (task.assignee_id ?? '') : (defaults.assigneeId ?? ''),
    due_date: task ? (task.due_date ?? '') : (defaults.dueDate ?? ''),
    project_id: task ? (task.project_id ?? '') : (defaults.projectId ?? ''),
    client_id: task ? (task.client_id ?? '') : (defaults.clientId ?? ''),
  };
}

export function validateTask(values: TaskFormValues): TaskFormErrors {
  return values.title.trim() ? {} : { title: 'Add a title.' };
}

export function toTaskPayload(values: TaskFormValues): TaskPayload {
  return {
    title: values.title.trim(),
    description: orNull(values.description),
    status: values.status,
    priority: values.priority,
    assignee_id: values.assignee_id || null,
    due_date: values.due_date || null,
    project_id: values.project_id || null,
    // The database copies the client from the project when there is one
    client_id: values.project_id ? null : values.client_id || null,
  };
}
