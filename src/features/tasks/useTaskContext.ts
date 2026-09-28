import { useMemo } from 'react';
import { useClients } from '@/features/clients/api';
import { useProjectMap } from '@/features/projects/api';
import type { Task } from './types';

/** "Project · Client", just the client, or "General" for a task. */
export function useTaskContext(): (task: Task) => string {
  const projects = useProjectMap();
  const { data: clients } = useClients();
  const clientNames = useMemo(() => new Map((clients ?? []).map((client) => [client.id, client.business_name])), [clients]);

  return (task: Task) => {
    const project = task.project_id ? projects.get(task.project_id) : undefined;
    const client = task.client_id ? clientNames.get(task.client_id) : undefined;
    if (project) return client ? `${project.name} · ${client}` : project.name;
    return client ?? 'General';
  };
}
