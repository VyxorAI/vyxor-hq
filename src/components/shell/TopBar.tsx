import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button, IconButton } from '@/components/Button';
import { shortcutLabel, usePalette } from '@/features/palette/PaletteProvider';
import { Logo } from './Logo';
import { navItemFor } from './navItems';

/** What "+ New" adds on each section; leads everywhere else. */
function newActionFor(pathname: string): { label: string; to: string } {
  if (pathname.startsWith('/clients')) return { label: 'New client', to: '/clients?new=1' };
  if (pathname.startsWith('/projects')) return { label: 'New project', to: '/projects?new=1' };
  if (pathname.startsWith('/my-week')) return { label: 'New task', to: '/my-week?newTask=1' };
  if (pathname.startsWith('/money')) return { label: 'New invoice', to: '/money?newInvoice=1' };
  if (pathname.startsWith('/library')) return { label: 'Add to library', to: '/library?new=1' };
  return { label: 'New lead', to: '/leads?new=1' };
}

/** Page title, the search / command palette trigger and the "+ New" action. */
export function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const palette = usePalette();
  const title = navItemFor(pathname)?.label ?? 'Vyxor HQ';
  const newAction = newActionFor(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-base/90 px-4 backdrop-blur md:px-6">
      <Logo className="size-7 shrink-0 md:hidden" />
      <h1 className="min-w-0 flex-1 truncate text-lg">{title}</h1>

      {/* Looks like a search field; opens the command palette */}
      <button
        type="button"
        onClick={palette.open}
        className="hidden h-9 w-72 items-center gap-2 rounded-control border border-border bg-surface px-2.5 text-sm text-muted transition-colors hover:border-muted/50 sm:flex"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="rounded-[4px] border border-border px-1.5 py-0.5 text-[10px]">{shortcutLabel()}</kbd>
      </button>
      <IconButton icon={Search} label="Search" onClick={palette.open} className="sm:hidden" />

      <Button variant="primary" icon={Plus} onClick={() => navigate(newAction.to)}>
        <span className="hidden sm:inline">{newAction.label}</span>
        <span className="sm:hidden">New</span>
      </Button>
    </header>
  );
}
