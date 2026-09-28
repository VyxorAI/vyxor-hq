import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  /** Existing tags offered as suggestions. */
  suggestions?: string[];
}

export function normaliseTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}

/** Type a tag, press Enter or comma to add it. Backspace on an empty field removes the last one. */
export function TagInput({ id, value, onChange, suggestions = [] }: TagInputProps) {
  const [draft, setDraft] = useState('');

  function add(raw: string) {
    const tags = raw.split(',').map(normaliseTag).filter(Boolean);
    const next = [...value];
    for (const tag of tags) if (!next.includes(tag)) next.push(tag);
    onChange(next);
    setDraft('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (draft.trim()) add(draft);
    } else if (event.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  const listId = `${id}-suggestions`;

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-control border border-border bg-raised px-2 py-1.5 focus-within:border-accent-blue focus-within:ring-2 focus-within:ring-accent-blue/40">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-control bg-accent-purple/15 px-1.5 py-0.5 text-xs font-medium text-accent-purple">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((item) => item !== tag))} aria-label={`Remove tag ${tag}`} className="hover:text-primary">
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        list={listId}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length === 0 ? 'e.g. onboarding, dental' : ''}
        className="min-w-24 flex-1 bg-transparent text-sm text-primary outline-none"
      />
      <datalist id={listId}>
        {suggestions.filter((tag) => !value.includes(tag)).map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
    </div>
  );
}
