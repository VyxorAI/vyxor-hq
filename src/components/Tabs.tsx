import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  /** Shown instead of switching, e.g. for later phases. */
  disabledHint?: string;
}

interface TabsProps<T extends string> {
  label: string;
  items: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  idPrefix: string;
}

/** Underlined tab list. Arrow keys move between enabled tabs. */
export function Tabs<T extends string>({ label, items, value, onChange, idPrefix }: TabsProps<T>) {
  const enabled = items.filter((item) => !item.disabledHint);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const index = enabled.findIndex((item) => item.value === value);
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = enabled[(index + step + enabled.length) % enabled.length];
    onChange(next.value);
    document.getElementById(`${idPrefix}-tab-${next.value}`)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="-mx-4 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border px-4 md:mx-0 md:px-0"
    >
      {items.map((item) => {
        const selected = item.value === value;
        const disabled = Boolean(item.disabledHint);
        return (
          <button
            key={item.value}
            id={`${idPrefix}-tab-${item.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            aria-disabled={disabled || undefined}
            tabIndex={selected ? 0 : -1}
            title={item.disabledHint}
            onClick={() => !disabled && onChange(item.value)}
            className={cn(
              '-mb-px inline-flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors',
              selected ? 'border-accent-blue text-primary' : 'border-transparent text-muted',
              disabled ? 'cursor-not-allowed opacity-50' : !selected && 'hover:text-primary',
            )}
          >
            {item.label}
            {item.disabledHint && <span className="text-xs font-normal">· {item.disabledHint}</span>}
          </button>
        );
      })}
    </div>
  );
}
