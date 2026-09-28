import type { ComponentProps } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const controlBase =
  'w-full rounded-control border border-border bg-raised text-sm text-primary transition-colors ' +
  'hover:border-muted/50 focus:border-accent-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 ' +
  'aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-60';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlBase, 'h-9 px-3', className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(controlBase, 'resize-y px-3 py-2 leading-relaxed', className)} {...props} />;
}

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> extends Omit<ComponentProps<'select'>, 'children'> {
  options: ReadonlyArray<SelectOption<T>>;
  /** Adds a first option with an empty value, e.g. "All industries" or "No owner". */
  placeholder?: string;
}

export function Select<T extends string>({ options, placeholder, className, ...props }: SelectProps<T>) {
  return (
    <div className={cn('relative', className)}>
      <select className={cn(controlBase, 'h-9 appearance-none pr-8 pl-3')} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
}
