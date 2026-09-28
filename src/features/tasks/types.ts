import type { Enums, Tables, TablesInsert } from '@/lib/database.types';

export type Task = Tables<'tasks'>;
export type TaskStatus = Enums<'task_status'>;
export type TaskPriority = Enums<'task_priority'>;

/** Task fields the app edits. */
export type TaskPayload = Omit<TablesInsert<'tasks'>, 'id' | 'created_at' | 'updated_at' | 'position'>;

/** A drag on a task board: put task `id` into `status` at `index` (0 = top). */
export interface TaskMove {
  id: string;
  status: TaskStatus;
  index: number;
}
