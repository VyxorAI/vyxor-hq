import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { IconButton } from '@/components/Button';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';
import { navItems } from './navItems';
import { UserMenu } from './UserMenu';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** Desktop sidebar: 240px, collapsible to icons. Hidden on phones. */
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-150 md:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className={cn('flex h-14 items-center gap-2.5 border-b border-border', collapsed ? 'justify-center' : 'px-4')}>
        <Logo className="size-7 shrink-0" />
        {!collapsed && <span className="font-display text-md font-semibold">Vyxor HQ</span>}
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 p-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex h-9 items-center gap-3 rounded-control px-2.5 font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive ? 'bg-raised text-primary' : 'text-muted hover:bg-raised/60 hover:text-primary',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('size-4 shrink-0', isActive && 'text-accent-blue')} aria-hidden />
                {collapsed ? <span className="sr-only">{label}</span> : label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border p-2 py-3">
        <UserMenu collapsed={collapsed} />
        <IconButton
          icon={collapsed ? PanelLeftOpen : PanelLeftClose}
          label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          size="sm"
          onClick={onToggle}
          className={collapsed ? 'self-center' : 'self-end'}
        />
      </div>
    </aside>
  );
}
