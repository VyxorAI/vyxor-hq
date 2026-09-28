import { todayISO } from '@/lib/format';
import { orNull } from '@/lib/validation';
import type { Project, ProjectPayload, ProjectStatus, ProjectType } from '../types';

export interface ProjectFormValues {
  client_id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  start_date: string;
  due_date: string;
  description: string;
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>;

export function toProjectFormValues(project: Project | undefined, defaultClientId?: string): ProjectFormValues {
  return {
    client_id: project?.client_id ?? defaultClientId ?? '',
    name: project?.name ?? '',
    type: project?.type ?? 'whatsapp_agent',
    status: project?.status ?? 'planning',
    start_date: project ? (project.start_date ?? '') : todayISO(),
    due_date: project?.due_date ?? '',
    description: project?.description ?? '',
  };
}

export function validateProject(values: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  if (!values.client_id) errors.client_id = 'Choose the client this project is for.';
  if (!values.name.trim()) errors.name = 'Add a project name.';
  if (values.start_date && values.due_date && values.due_date < values.start_date) {
    errors.due_date = "The due date can't be before the start date.";
  }
  return errors;
}

export function toProjectPayload(values: ProjectFormValues): ProjectPayload {
  return {
    client_id: values.client_id,
    name: values.name.trim(),
    type: values.type,
    status: values.status,
    start_date: values.start_date || null,
    due_date: values.due_date || null,
    description: orNull(values.description),
  };
}
