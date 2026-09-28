import type { Task, TaskMove } from './types';

export function byPosition(a: Task, b: Task): number {
  return a.position - b.position || a.created_at.localeCompare(b.created_at);
}

/**
 * Apply a move locally, mirroring the move_task() SQL function: columns are
 * scoped to the task's own project (or the general board).
 */
export function applyTaskMove(tasks: Task[], move: TaskMove): Task[] {
  const moving = tasks.find((task) => task.id === move.id);
  if (!moving) return tasks;
  const sameBoard = (task: Task) => task.project_id === moving.project_id;

  const updates = new Map<string, Task>();
  const target = tasks.filter((task) => sameBoard(task) && task.status === move.status && task.id !== move.id).sort(byPosition);
  const index = Math.min(Math.max(move.index, 0), target.length);
  target.splice(index, 0, { ...moving, status: move.status });
  target.forEach((task, position) => updates.set(task.id, { ...task, position }));

  if (moving.status !== move.status) {
    tasks
      .filter((task) => sameBoard(task) && task.status === moving.status && task.id !== move.id)
      .sort(byPosition)
      .forEach((task, position) => updates.set(task.id, { ...task, position }));
  }

  return tasks.map((task) => updates.get(task.id) ?? task);
}

/** "3 of 8 done" counts per project. */
export function progressByProject(tasks: Task[]): Map<string, { done: number; total: number }> {
  const progress = new Map<string, { done: number; total: number }>();
  for (const task of tasks) {
    if (!task.project_id) continue;
    const entry = progress.get(task.project_id) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (task.status === 'done') entry.done += 1;
    progress.set(task.project_id, entry);
  }
  return progress;
}
