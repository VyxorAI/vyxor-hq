import { useRef, useState, type DragEvent } from 'react';
import { FileUp, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatBytes } from '@/lib/format';
import { MAX_FILE_BYTES } from '../constants';

interface FileDropzoneProps {
  id: string;
  file: File | null;
  onChange: (file: File | null) => void;
  /** Shown when nothing new is picked, e.g. the current file on edit. */
  currentName?: string | null;
  error?: string;
}

/** Drag a file in or click to pick one (max 25 MB). */
export function FileDropzone({ id, file, onChange, currentName, error }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const tooBig = file !== null && file.size > MAX_FILE_BYTES;

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center gap-2 rounded-card border border-dashed px-4 py-6 text-center transition-colors',
          dragging ? 'border-accent-blue bg-accent-blue/10' : 'border-border bg-raised/40',
          (error || tooBig) && 'border-danger',
        )}
      >
        <FileUp className="size-5 text-muted" aria-hidden />
        <p className="text-sm">
          Drag a file here, or{' '}
          <button type="button" onClick={() => inputRef.current?.click()} className="font-medium text-accent-blue hover:underline">
            choose one
          </button>
        </p>
        <p className="text-xs text-muted">PDF, Word, images, anything up to 25 MB</p>
        <input
          ref={inputRef}
          id={id}
          type="file"
          className="sr-only"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
      </div>

      {(file || currentName) && (
        <div className="flex items-center gap-2 rounded-control bg-raised px-3 py-2 text-sm">
          <Paperclip className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{file ? file.name : currentName}</span>
          {file ? (
            <>
              <span className={cn('text-xs tabular-nums', tooBig ? 'text-danger' : 'text-muted')}>{formatBytes(file.size)}</span>
              <button type="button" onClick={() => onChange(null)} aria-label="Remove file" className="text-muted hover:text-primary">
                <X className="size-4" aria-hidden />
              </button>
            </>
          ) : (
            <span className="text-xs text-muted">Current file</span>
          )}
        </div>
      )}
      {(error || tooBig) && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {tooBig ? 'That file is over 25 MB.' : error}
        </p>
      )}
    </div>
  );
}
