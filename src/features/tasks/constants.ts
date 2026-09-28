import type { BadgeTone } from '@/components/Badge';
import type { SelectOption } from '@/components/Input';
import type { TaskPriority, TaskStatus } from './types';

export interface TaskStatusMeta {
  value: TaskStatus;
  label: string;
  dot: string;
}

export const TASK_STATUSES: readonly TaskStatusMeta[] = [
  { value: 'todo', label: 'To do', dot: 'bg-muted' },
  { value: 'doing', label: 'Doing', dot: 'bg-accent-blue' },
  { value: 'done', label: 'Done', dot: 'bg-accent-teal' },
];

export const TASK_STATUS_ORDER: readonly TaskStatus[] = TASK_STATUSES.map((status) => status.value);

export const TASK_STATUS_META = Object.fromEntries(TASK_STATUSES.map((status) => [status.value, status])) as Record<
  TaskStatus,
  TaskStatusMeta
>;

export const TASK_STATUS_OPTIONS: SelectOption<TaskStatus>[] = TASK_STATUSES.map(({ value, label }) => ({ value, label }));

export const PRIORITY_META: Record<TaskPriority, { label: string; tone: BadgeTone }> = {
  high: { label: 'High', tone: 'danger' },
  medium: { label: 'Medium', tone: 'neutral' },
  low: { label: 'Low', tone: 'neutral' },
};

export const PRIORITY_OPTIONS: SelectOption<TaskPriority>[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];
