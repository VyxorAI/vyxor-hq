import { Link } from 'react-router-dom';
import { AlertCircle, ChevronRight, FilterX, FolderKanban, ListTodo, Plus, Search } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Select } from '@/components/Input';
import { Spinner } from '@/components/Spinner';
import { useClients } from '@/features/clients/api';
import { useTasks } from '@/features/tasks/api';
import { progressByProject } from '@/features/tasks/ordering';
import { cn } from '@/lib/cn';
import { useUpdateParams } from '@/lib/useUpdateParams';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { useProjects } from './api';
import { ProjectRow } from './components/ProjectRow';
import { PROJECT_STATUSES } from './constants';
import { ProjectDrawer } from './ProjectDrawer';

const FILTER_KEYS = ['q', 'client'] as const;

/** Projects grouped by status. URL state: `new=1` (+ `client=<id>`) opens the new project drawer. */
export function ProjectsPage() {
  const [params, updateParams] = useUpdateParams();
  const { values: filters, setFilter, clearFilters, activeCount } = useUrlFilters(FILTER_KEYS);
  const { data: projects, isPending, error, refetch } = useProjects();
  const { data: clients = [] } = useClients();
  const { data: tasks = [] } = useTasks();

  const creating = params.get('new') === '1';
  const openNew = () => updateParams((p) => p.set('new', '1'));
  const closeNew = () =>
    updateParams((p) => {
      p.delete('new');
      p.delete('client');
    }, true);

  const clientNames = new Map(clients.map((client) => [client.id, client.business_name]));
  const progress = progressByProject(tasks);
  const openGeneral = tasks.filter((task) => !task.project_id && task.status !== 'done').length;

  const query = filters.q.trim().toLowerCase();
  const visible = (projects ?? []).filter(
    (project) =>
      (!filters.client || project.client_id === filters.client) &&
      (!query ||
        project.name.toLowerCase().includes(query) ||
        (clientNames.get(project.client_id) ?? '').toLowerCase().includes(query)),
  );

  let content;
  if (isPending) {
    content = (
      <div className="flex justify-center py-20">
        <Spinner label="Loading projects" />
      </div>
    );
  } else if (!projects) {
    content = (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load projects"
        description={error?.message}
        action={<Button onClick={() => void refetch()}>Try again</Button>}
      />
    );
  } else if (projects.length === 0) {
    content = (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description={
          clients.length === 0
            ? 'Every project belongs to a client. Add a client first, then its projects.'
            : 'Add one here or from a client’s page.'
        }
        action={
          clients.length === 0 ? (
            <Link to="/clients" className="font-medium text-accent-blue hover:underline">
              Go to clients
            </Link>
          ) : (
            <Button variant="primary" icon={Plus} onClick={openNew}>
              Add project
            </Button>
          )
        }
      />
    );
  } else if (visible.length === 0) {
    content = (
      <EmptyState
        icon={FilterX}
        title="No projects match these filters"
        action={<Button onClick={clearFilters}>Clear filters</Button>}
      />
    );
  } else {
    content = (
      <div className="flex flex-col gap-5">
        {PROJECT_STATUSES.map((status) => {
          const group = visible.filter((project) => project.status === status.value);
          if (group.length === 0) return null;
          return (
            <section key={status.value} aria-labelledby={`status-${status.value}`} className="flex flex-col gap-2">
              <h2 id={`status-${status.value}`} className="flex items-center gap-2 text-sm">
                <span className={cn('size-2 rounded-full', status.dot)} aria-hidden />
                {status.label}
                <span className="font-sans text-xs font-normal text-muted tabular-nums">{group.length}</span>
              </h2>
              <ul className="overflow-hidden rounded-card border border-border bg-surface">
                {group.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    clientName={clientNames.get(project.client_id)}
                    progress={progress.get(project.id)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={filters.q}
            onChange={(event) => setFilter('q', event.target.value)}
            placeholder="Search projects or clients"
            aria-label="Search projects"
            className="h-9 w-full rounded-control border border-border bg-raised pr-3 pl-8 text-sm text-primary focus:border-accent-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
          />
        </div>
        <Select
          aria-label="Filter by client"
          placeholder="All clients"
          options={clients.map((client) => ({ value: client.id, label: client.business_name }))}
          value={filters.client}
          onChange={(event) => setFilter('client', event.target.value)}
          className="flex-1 sm:w-48 sm:flex-none"
        />
        {activeCount > 0 && (
          <Button variant="ghost" icon={FilterX} onClick={clearFilters}>
            Clear
          </Button>
        )}
        <Button icon={Plus} onClick={openNew} className="ml-auto">
          Add project
        </Button>
      </div>

      <Link
        to="/projects/general"
        className="flex items-center gap-3 rounded-card border border-border bg-surface px-3 py-3 transition-colors hover:bg-raised"
      >
        <span className="flex size-8 items-center justify-center rounded-control bg-raised text-muted">
          <ListTodo className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">General tasks</p>
          <p className="text-xs text-muted">Agency work that isn't part of a project</p>
        </div>
        <span className="text-xs text-muted tabular-nums">{openGeneral} open</span>
        <ChevronRight className="size-4 text-muted" aria-hidden />
      </Link>

      {content}

      {creating && (
        <ProjectDrawer project={undefined} defaultClientId={params.get('client') ?? undefined} onClose={closeNew} />
      )}
    </div>
  );
}
