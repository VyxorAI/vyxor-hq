import { DndContext, DragOverlay } from '@dnd-kit/core';
import { dropAnimation, KanbanColumn, KanbanColumns } from '@/components/kanban/KanbanColumn';
import { useKanbanBoard } from '@/components/kanban/useKanbanBoard';
import { useProfileMap } from '@/features/auth/profiles';
import { useMoveTask } from '../api';
import { TASK_STATUS_META, TASK_STATUS_ORDER, TASK_STATUSES } from '../constants';
import type { Task, TaskStatus } from '../types';
import { QuickAddTask } from './QuickAddTask';
import { SortableTaskCard } from './SortableTaskCard';
import { TaskCard } from './TaskCard';

const taskStatus = (task: Task) => task.status;
const taskTitle = (task: Task) => task.title;
const statusLabel = (status: TaskStatus) => TASK_STATUS_META[status].label;

interface TaskBoardProps {
  /** Tasks of one board: a project's tasks, or the general tasks. */
  tasks: Task[];
  projectId: string | null;
  onOpenTask: (id: string) => void;
  /** Secondary line per card (e.g. client name on the general board). */
  contextFor?: (task: Task) => string | undefined;
}

export function TaskBoard({ tasks, projectId, onOpenTask, contextFor }: TaskBoardProps) {
  const profiles = useProfileMap();
  const moveTask = useMoveTask();

  const board = useKanbanBoard({
    items: tasks,
    columnOrder: TASK_STATUS_ORDER,
    getColumn: taskStatus,
    onMove: ({ id, column, index }) => moveTask({ id, status: column, index }),
    itemLabel: taskTitle,
    columnLabel: statusLabel,
    noun: 'task',
  });
  const openTask = board.guardOpen(onOpenTask);
  const assigneeOf = (task: Task) => (task.assignee_id ? profiles.get(task.assignee_id) : undefined);
  const activeTask = board.activeItem;

  return (
    <DndContext {...board.contextProps}>
      <KanbanColumns>
        {TASK_STATUSES.map((status) => {
          const columnTasks = board.itemsIn(status.value);
          return (
            <KanbanColumn
              key={status.value}
              id={status.value}
              label={status.label}
              dot={status.dot}
              itemIds={columnTasks.map((task) => task.id)}
              emptyText={status.value === 'done' ? 'Finished tasks land here' : 'Drop a task here'}
              top={status.value === 'todo' ? <QuickAddTask projectId={projectId} /> : undefined}
            >
              {columnTasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  assignee={assigneeOf(task)}
                  context={contextFor?.(task)}
                  onOpen={openTask}
                />
              ))}
            </KanbanColumn>
          );
        })}
      </KanbanColumns>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask && (
          <TaskCard
            task={activeTask}
            assignee={assigneeOf(activeTask)}
            context={contextFor?.(activeTask)}
            lifted
            className="w-[262px] cursor-grabbing"
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
