import { useMemo, useRef, useState } from 'react';
import {
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DndContextProps,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export interface KanbanItem {
  id: string;
  position: number;
  created_at: string;
}

export interface KanbanMove<C extends string> {
  id: string;
  column: C;
  /** 0 = top of the column. */
  index: number;
}

export type Columns<C extends string> = Record<C, string[]>;

/** Return "hold" to keep the card in its new column until `release()` (e.g. while a modal asks a question). */
export type MoveResult = void | 'hold';

interface Options<C extends string, T extends KanbanItem> {
  items: T[];
  columnOrder: readonly C[];
  getColumn: (item: T) => C;
  onMove: (move: KanbanMove<C>, item: T) => MoveResult;
  /** For screen reader announcements. */
  itemLabel: (item: T) => string;
  columnLabel: (column: C) => string;
  /** Wording for the item in instructions, e.g. "lead". */
  noun: string;
}

function byPosition(a: KanbanItem, b: KanbanItem): number {
  return a.position - b.position || a.created_at.localeCompare(b.created_at);
}

/**
 * Drag-and-drop state for a board of columns: cards move between columns while
 * dragging, then `onMove` is called once with the final column and index.
 */
export function useKanbanBoard<C extends string, T extends KanbanItem>({
  items,
  columnOrder,
  getColumn,
  onMove,
  itemLabel,
  columnLabel,
  noun,
}: Options<C, T>) {
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const serverColumns = useMemo(() => {
    const columns = Object.fromEntries(columnOrder.map((column) => [column, [] as string[]])) as Columns<C>;
    for (const item of [...items].sort(byPosition)) columns[getColumn(item)]?.push(item.id);
    return columns;
  }, [items, columnOrder, getColumn]);

  // While dragging (or while a move is held) the board shows local columns
  const [dragColumns, setDragColumns] = useState<Columns<C> | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastDragEnd = useRef(0);
  const columns = dragColumns ?? serverColumns;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter is kept free for opening the card
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  );

  const isColumn = (id: UniqueIdentifier): id is C => (columnOrder as readonly UniqueIdentifier[]).includes(id);
  const findColumn = (id: UniqueIdentifier, current: Columns<C>): C | undefined =>
    isColumn(id) ? id : columnOrder.find((column) => current[column].includes(String(id)));

  /** Drop any local column state and follow the server data again. */
  function release() {
    setActiveId(null);
    setDragColumns(null);
    lastDragEnd.current = Date.now();
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setDragColumns(serverColumns);
  }

  // Moving across columns: shift the card into the hovered column as you drag
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    setDragColumns((previous) => {
      const current = previous ?? serverColumns;
      const from = findColumn(active.id, current);
      const to = findColumn(over.id, current);
      if (!from || !to || from === to) return current;

      const activeKey = String(active.id);
      const targetItems = current[to];
      let index = targetItems.length;
      if (!isColumn(over.id)) {
        const overIndex = targetItems.indexOf(String(over.id));
        const translated = active.rect.current.translated;
        const below = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
        if (overIndex >= 0) index = overIndex + (below ? 1 : 0);
      }

      return {
        ...current,
        [from]: current[from].filter((id) => id !== activeKey),
        [to]: [...targetItems.slice(0, index), activeKey, ...targetItems.slice(index)],
      };
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const id = String(active.id);
    const item = itemsById.get(id);
    const column = findColumn(id, columns);
    if (!over || !item || !column) return release();

    // Reordering inside the final column
    let ids = columns[column];
    if (findColumn(over.id, columns) === column && !isColumn(over.id)) {
      const from = ids.indexOf(id);
      const to = ids.indexOf(String(over.id));
      if (from !== to && to >= 0) ids = arrayMove(ids, from, to);
    }
    const index = ids.indexOf(id);

    const unchanged = getColumn(item) === column && serverColumns[column].indexOf(id) === index;
    if (unchanged) return release();

    if (onMove({ id, column, index }, item) === 'hold') {
      setActiveId(null);
      setDragColumns({ ...columns, [column]: ids });
      lastDragEnd.current = Date.now();
      return;
    }
    release();
  }

  /** Ignore the click that can fire when a drag ends on the same card. */
  function guardOpen(open: (id: string) => void) {
    return (id: string) => {
      if (Date.now() - lastDragEnd.current < 250) return;
      open(id);
    };
  }

  // Screen reader announcements by name and column, not internal ids
  const nameOf = (id: UniqueIdentifier) => {
    const item = itemsById.get(String(id));
    return item ? itemLabel(item) : noun;
  };
  const columnOf = (id: UniqueIdentifier) => {
    const column = findColumn(id, columns);
    return column ? columnLabel(column) : 'the board';
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} is over ${columnOf(over.id)}.` : `${nameOf(active.id)} is not over a column.`,
    onDragEnd: ({ active, over }) =>
      over ? `${nameOf(active.id)} dropped in ${columnOf(over.id)}.` : `${nameOf(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Moving ${nameOf(active.id)} was cancelled.`,
  };

  const contextProps: DndContextProps = {
    sensors,
    collisionDetection: closestCorners,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
    onDragCancel: release,
    accessibility: {
      announcements,
      screenReaderInstructions: {
        draggable: `Press Enter to open this ${noun}. To move it, press Space, use the arrow keys to change column or order, then press Space again to drop or Escape to cancel.`,
      },
    },
  };

  /** Items of one column, in board order. */
  function itemsIn(column: C): T[] {
    return columns[column].map((id) => itemsById.get(id)).filter((item): item is T => item !== undefined);
  }

  return {
    itemsIn,
    activeItem: activeId ? itemsById.get(activeId) : undefined,
    contextProps,
    release,
    guardOpen,
  };
}
