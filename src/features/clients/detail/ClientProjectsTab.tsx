import { useState } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useProjects } from '@/features/projects/api';
import { ProjectRow } from '@/features/projects/components/ProjectRow';
import { PROJECT_STATUSES } from '@/features/projects/constants';
import { ProjectDrawer } from '@/features/projects/ProjectDrawer';
import { useTasks } from '@/features/tasks/api';
import { progressByProject } from '@/features/tasks/ordering';
import type { Client } from '../types';

const statusOrder = PROJECT_STATUSES.map((status) => status.value);

export function ClientProjectsTab({ client }: { client: Client }) {
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const [adding, setAdding] = useState(false);

  const clientProjects = projects
    .filter((project) => project.client_id === client.id)
    .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) || a.name.localeCompare(b.name));
  const progress = progressByProject(tasks);

  return (
    <div className="flex max-w-4xl flex-col gap-3">
      {clientProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects for this client yet"
          description="Add the first one to start tracking its tasks."
          action={
            <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
              Add project
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex justify-end">
            <Button icon={Plus} onClick={() => setAdding(true)}>
              Add project
            </Button>
          </div>
          <ul className="overflow-hidden rounded-card border border-border bg-surface">
            {clientProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                clientName={client.business_name}
                progress={progress.get(project.id)}
                showStatus
              />
            ))}
          </ul>
        </>
      )}

      {adding && <ProjectDrawer project={undefined} defaultClientId={client.id} onClose={() => setAdding(false)} />}
    </div>
  );
}
