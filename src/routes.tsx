import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ClientDetailPage } from '@/features/clients/ClientDetailPage';
import { ClientsPage } from '@/features/clients/ClientsPage';
import { LeadsPage } from '@/features/leads/LeadsPage';
import { ComingSoon, NotFound } from '@/features/placeholder/ComingSoon';
import { GeneralTasksPage } from '@/features/projects/GeneralTasksPage';
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { MyWeekPage } from '@/features/tasks/MyWeekPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ComingSoon title="The home dashboard" phase="Phase 2" /> },
      { path: 'leads', element: <LeadsPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:clientId', element: <ClientDetailPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/general', element: <GeneralTasksPage /> },
      { path: 'projects/:projectId', element: <ProjectDetailPage /> },
      { path: 'my-week', element: <MyWeekPage /> },
      { path: 'money', element: <ComingSoon title="Money" phase="Phase 2" /> },
      { path: 'library', element: <ComingSoon title="The library" phase="Phase 3" /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
