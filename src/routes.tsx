import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ClientDetailPage } from '@/features/clients/ClientDetailPage';
import { ClientsPage } from '@/features/clients/ClientsPage';
import { HomePage } from '@/features/home/HomePage';
import { LeadsPage } from '@/features/leads/LeadsPage';
import { MoneyPage } from '@/features/money/MoneyPage';
import { NotFound } from '@/features/placeholder/NotFound';
import { GeneralTasksPage } from '@/features/projects/GeneralTasksPage';
import { ProspectsPage } from '@/features/prospects/ProspectsPage';
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { MyWeekPage } from '@/features/tasks/MyWeekPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'leads', element: <LeadsPage /> },
      { path: 'prospects', element: <ProspectsPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:clientId', element: <ClientDetailPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/general', element: <GeneralTasksPage /> },
      { path: 'projects/:projectId', element: <ProjectDetailPage /> },
      { path: 'my-week', element: <MyWeekPage /> },
      { path: 'money', element: <MoneyPage /> },
      // The library brings the markdown renderer; load it only when visited
      {
        path: 'library',
        lazy: async () => ({ Component: (await import('@/features/library/LibraryPage')).LibraryPage }),
      },
      {
        path: 'library/:assetId',
        lazy: async () => ({ Component: (await import('@/features/library/AssetDetailPage')).AssetDetailPage }),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
