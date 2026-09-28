import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Ellipsis } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/cn';
import { navItems } from './navItems';
import { UserMenu } from './UserMenu';

const tabClass = 'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors';

/** Phone navigation: Home, Leads, Clients, Projects, More. */
export function MobileTabBar() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const moreItems = navItems.filter((item) => !item.mobile);
  const moreActive = moreItems.some((item) => pathname.startsWith(item.to));

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {navItems
          .filter((item) => item.mobile)
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => cn(tabClass, isActive ? 'text-accent-blue' : 'text-muted')}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(tabClass, moreActive ? 'text-accent-blue' : 'text-muted')}
        >
          <Ellipsis className="size-5" aria-hidden />
          More
        </button>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="flex flex-col gap-1">
          {moreItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-control px-3 font-medium',
                  isActive ? 'bg-raised text-primary' : 'text-muted hover:bg-raised',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
        <div className="border-t border-border pt-4">
          <UserMenu collapsed={false} />
        </div>
      </Modal>
    </>
  );
}
