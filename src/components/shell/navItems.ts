import {
  CalendarCheck,
  FolderKanban,
  House,
  LibraryBig,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Shown directly in the mobile tab bar; the rest go under "More". */
  mobile: boolean;
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: House, mobile: true },
  { to: '/leads', label: 'Leads', icon: Target, mobile: true },
  { to: '/clients', label: 'Clients', icon: Users, mobile: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban, mobile: true },
  { to: '/my-week', label: 'My week', icon: CalendarCheck, mobile: false },
  { to: '/money', label: 'Money', icon: Wallet, mobile: false },
  { to: '/library', label: 'Library', icon: LibraryBig, mobile: false },
];

/** The nav item for a pathname: exact match for Home, prefix match for the rest. */
export function navItemFor(pathname: string): NavItem | undefined {
  return navItems.find((item) => (item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)));
}
