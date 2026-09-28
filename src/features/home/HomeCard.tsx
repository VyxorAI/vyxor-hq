import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface HomeCardProps {
  id: string;
  title: string;
  count?: number;
  link?: { to: string; label: string };
  className?: string;
  children: ReactNode;
}

export function HomeCard({ id, title, count, link, className, children }: HomeCardProps) {
  return (
    <section aria-labelledby={id} className={cn('flex flex-col rounded-card border border-border bg-surface', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 id={id} className="text-sm">
          {title}
          {count !== undefined && (
            <span className="ml-2 font-sans text-xs font-normal text-muted tabular-nums">{count}</span>
          )}
        </h2>
        {link && (
          <Link to={link.to} className="inline-flex items-center gap-1 text-xs font-medium text-accent-blue hover:underline">
            {link.label}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

/** Quiet one-line empty state inside a card. */
export function CardEmpty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-muted">{children}</p>;
}
