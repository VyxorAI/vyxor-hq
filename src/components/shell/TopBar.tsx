import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/Button';
import { Logo } from './Logo';
import { navItemFor } from './navItems';

/** What "+ New" adds on each section; leads everywhere else. */
function newActionFor(pathname: string): { label: string; to: string } {
  if (pathname.startsWith('/clients')) return { label: 'New client', to: '/clients?new=1' };
  if (pathname.startsWith('/projects')) return { label: 'New project', to: '/projects?new=1' };
  if (pathname.startsWith('/my-week')) return { label: 'New task', to: '/my-week?newTask=1' };
  if (pathname.startsWith('/money')) return { label: 'New invoice', to: '/money?newInvoice=1' };
  return { label: 'New lead', to: '/leads?new=1' };
}

/** Page title, lead search and the "+ New" action. */
export function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const title = navItemFor(pathname)?.label ?? 'Vyxor HQ';
  const newAction = newActionFor(pathname);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({ view: 'table' });
    if (query.trim()) params.set('q', query.trim());
    navigate(`/leads?${params.toString()}`);
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-base/90 px-4 backdrop-blur md:px-6">
      <Logo className="size-7 shrink-0 md:hidden" />
      <h1 className="min-w-0 flex-1 truncate text-lg">{title}</h1>

      <form role="search" onSubmit={handleSearch} className="relative hidden w-72 sm:block">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search leads"
          aria-label="Search leads"
          className="h-9 w-full rounded-control border border-border bg-surface pr-3 pl-8 text-sm text-primary focus:border-accent-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
        />
      </form>

      <Button variant="primary" icon={Plus} onClick={() => navigate(newAction.to)}>
        <span className="hidden sm:inline">{newAction.label}</span>
        <span className="sm:hidden">New</span>
      </Button>
    </header>
  );
}
