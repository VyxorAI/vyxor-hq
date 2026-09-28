import type { KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Props to spread onto a board card: drag with mouse, long-press on touch,
 * Space on keyboard. Click or Enter opens it.
 */
export function useSortableCard(id: string, label: string, onOpen: (id: string) => void) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' && !isDragging) {
      event.preventDefault();
      onOpen(id);
      return;
    }
    listeners?.onKeyDown?.(event);
  }

  return {
    isDragging,
    props: {
      ref: setNodeRef,
      style: { transform: CSS.Translate.toString(transform), transition },
      ...attributes,
      ...listeners,
      'aria-roledescription': 'card',
      'aria-label': label,
      onKeyDown,
      onClick: () => onOpen(id),
    },
  };
}
