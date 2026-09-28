import { SquareKanban, Table2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type LeadsView = 'board' | 'table';

const options = [
  { value: 'board', label: 'Board', icon: SquareKanban },
  { value: 'table', label: 'Table', icon: Table2 },
] as const;

export function ViewToggle({ value, onChange }: { value: LeadsView; onChange: (view: LeadsView) => void }) {
  return (
    <div role="group" aria-label="View" className="inline-flex rounded-control border border-border bg-surface p-0.5">
      {options.map(({ value: option, label, icon: Icon }) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-sm font-medium transition-colors',
            value === option ? 'bg-raised text-primary' : 'text-muted hover:text-primary',
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
