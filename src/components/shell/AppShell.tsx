import { Outlet } from 'react-router-dom';
import { MobileTabBar } from './MobileTabBar';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useStoredState } from './useStoredState';

export function AppShell() {
  const [collapsed, setCollapsed] = useStoredState('vyxor:sidebar-collapsed', false);

  return (
    <div className="flex min-h-dvh">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="w-full max-w-[1400px] flex-1 px-4 pt-5 pb-24 md:px-6 md:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
