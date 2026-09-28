import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/cn';

interface KanbanColumnProps {
  id: string;
  label: string;
  /** Tailwind background class for the status dot. */
  dot: string;
  itemIds: string[];
  /** Right side of the header, e.g. a money total. */
  meta?: ReactNode;
  /** Above the cards, e.g. a quick-add input. */
  top?: ReactNode;
  emptyText?: string;
  children: ReactNode;
}

export function KanbanColumn({ id, label, dot, itemIds, meta, top, emptyText = 'Drop here', children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section
      aria-label={`${label} column`}
      className="flex w-[280px] shrink-0 snap-start flex-col rounded-card border border-border bg-surface/50"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 rounded-full', dot)} aria-hidden />
          <h2 className="font-sans text-sm font-semibold">{label}</h2>
          <span className="rounded-control bg-raised px-1.5 text-xs font-medium tabular-nums text-muted">
            {itemIds.length}
          </span>
        </div>
        {meta}
      </header>

      {top && <div className="border-b border-border p-2">{top}</div>}

      <SortableContext id={id} items={itemIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={cn('flex min-h-32 flex-1 flex-col gap-2 p-2 transition-colors', isOver && 'bg-raised/30')}>
          {children}
          {itemIds.length === 0 && (
            <p className="flex flex-1 items-center justify-center rounded-control border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
              {emptyText}
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

/** Horizontal scroller that holds the columns. */
export function KanbanColumns({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:-mx-6 md:snap-none md:px-6">
      {children}
    </div>
  );
}

export const dropAnimation = { duration: 150, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' };
