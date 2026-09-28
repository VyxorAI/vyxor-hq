import { useState } from 'react';
import { Textarea } from '@/components/Input';
import { cn } from '@/lib/cn';
import { MarkdownView } from './Markdown';

interface MarkdownEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Editor and preview side by side on wide screens (detail page). */
  split?: boolean;
  rows?: number;
  invalid?: boolean;
}

/** Markdown textarea with Write / Preview tabs, or side by side when `split`. */
export function MarkdownEditor({ id, value, onChange, split = false, rows = 14, invalid }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  const editor = (
    <Textarea
      id={id}
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={'# Title\n\nSteps, notes, or a prompt. Markdown works: **bold**, lists, tables, `code`.'}
      className="font-mono text-[13px] leading-relaxed"
      aria-invalid={invalid || undefined}
      spellCheck
    />
  );
  const preview = (
    <div className="min-h-40 overflow-y-auto rounded-control border border-border bg-base/60 p-4">
      {value.trim() ? <MarkdownView>{value}</MarkdownView> : <p className="text-sm text-muted">Nothing to preview yet.</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Editor view" className={cn('flex gap-1', split && 'lg:hidden')}>
        {(['write', 'preview'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={mode === option}
            onClick={() => setMode(option)}
            className={cn(
              'h-7 rounded-control px-2.5 text-xs font-medium transition-colors',
              mode === option ? 'bg-raised text-primary' : 'text-muted hover:text-primary',
            )}
          >
            {option === 'write' ? 'Write' : 'Preview'}
          </button>
        ))}
      </div>
      {split ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className={cn(mode === 'preview' && 'hidden lg:block')}>{editor}</div>
          <div className={cn(mode === 'write' && 'hidden lg:block')}>{preview}</div>
        </div>
      ) : mode === 'write' ? (
        editor
      ) : (
        preview
      )}
    </div>
  );
}
