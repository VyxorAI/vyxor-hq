import type { ReactNode } from 'react';

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-display text-sm font-semibold text-primary">{title}</legend>
      {children}
    </fieldset>
  );
}
