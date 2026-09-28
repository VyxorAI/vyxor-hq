import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/errors';
import { useAddActivity } from './api';
import { MANUAL_KINDS } from './describe';
import type { ActivityEntity, ManualKind } from './types';

const PLACEHOLDERS: Record<ManualKind, string> = {
  note: 'What happened, what was agreed, what to remember',
  call: 'Who you spoke to and what came out of it',
  email: 'What was sent or received',
};

/** Log a note, call or email against a record. Ctrl/Cmd + Enter saves. */
export function ActivityComposer({ entityType, entityId }: { entityType: ActivityEntity; entityId: string }) {
  const toast = useToast();
  const addActivity = useAddActivity();
  const [kind, setKind] = useState<ManualKind>('note');
  const [body, setBody] = useState('');
  const action = MANUAL_KINDS.find((item) => item.value === kind)!;

  function submit() {
    const text = body.trim();
    if (!text || addActivity.isPending) return;
    addActivity.mutate(
      { entity_type: entityType, entity_id: entityId, kind, body: text },
      {
        onSuccess: () => setBody(''),
        onError: (error) => toast.error(`Couldn't save that. ${errorMessage(error)}`),
      },
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3">
      <div role="group" aria-label="Type" className="flex gap-1">
        {MANUAL_KINDS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={kind === value}
            onClick={() => setKind(value)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-control px-2.5 text-xs font-medium transition-colors',
              kind === value ? 'bg-raised text-primary' : 'text-muted hover:text-primary',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <Textarea
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDERS[kind]}
        aria-label={`${action.label} text`}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="hidden text-xs text-muted sm:inline">Ctrl + Enter to save</span>
        <Button type="submit" size="sm" variant="primary" loading={addActivity.isPending} disabled={!body.trim()} className="ml-auto">
          {action.action}
        </Button>
      </div>
    </form>
  );
}
