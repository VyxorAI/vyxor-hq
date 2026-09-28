import type { FormEvent } from 'react';
import { Field } from '@/components/Field';
import { Input, Select, Textarea } from '@/components/Input';
import { useProfiles } from '@/features/auth/profiles';
import { useClients } from '@/features/clients/api';
import { useProjects } from '@/features/projects/api';
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../constants';
import type { TaskFormErrors, TaskFormValues } from './taskFormModel';

interface TaskFormProps {
  id: string;
  values: TaskFormValues;
  errors: TaskFormErrors;
  onChange: <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => void;
  onSubmit: () => void;
}

export function TaskForm({ id, values, errors, onChange, onSubmit }: TaskFormProps) {
  const { data: profiles = [] } = useProfiles();
  const { data: projects = [] } = useProjects();
  const { data: clients = [] } = useClients();
  const clientName = new Map(clients.map((client) => [client.id, client.business_name]));

  const assigneeOptions = profiles.map((profile) => ({ value: profile.id, label: profile.full_name }));
  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: `${project.name} · ${clientName.get(project.client_id) ?? 'Unknown client'}`,
  }));
  const clientOptions = clients.map((client) => ({ value: client.id, label: client.business_name }));
  const project = projects.find((item) => item.id === values.project_id);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form id={id} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Title" htmlFor={`${id}-title`} error={errors.title} required>
        <Input
          id={`${id}-title`}
          value={values.title}
          onChange={(event) => onChange('title', event.target.value)}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${id}-title-error` : undefined}
          data-autofocus
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Status" htmlFor={`${id}-status`}>
          <Select
            id={`${id}-status`}
            options={TASK_STATUS_OPTIONS}
            value={values.status}
            onChange={(event) => onChange('status', event.target.value as TaskFormValues['status'])}
          />
        </Field>
        <Field label="Priority" htmlFor={`${id}-priority`}>
          <Select
            id={`${id}-priority`}
            options={PRIORITY_OPTIONS}
            value={values.priority}
            onChange={(event) => onChange('priority', event.target.value as TaskFormValues['priority'])}
          />
        </Field>
        <Field label="Assignee" htmlFor={`${id}-assignee_id`}>
          <Select
            id={`${id}-assignee_id`}
            placeholder="Unassigned"
            options={assigneeOptions}
            value={values.assignee_id}
            onChange={(event) => onChange('assignee_id', event.target.value)}
          />
        </Field>
        <Field label="Due date" htmlFor={`${id}-due_date`}>
          <Input
            id={`${id}-due_date`}
            type="date"
            value={values.due_date}
            onChange={(event) => onChange('due_date', event.target.value)}
          />
        </Field>
        <Field label="Project" htmlFor={`${id}-project_id`}>
          <Select
            id={`${id}-project_id`}
            placeholder="No project (general)"
            options={projectOptions}
            value={values.project_id}
            onChange={(event) => onChange('project_id', event.target.value)}
          />
        </Field>
        <Field
          label="Client"
          htmlFor={`${id}-client_id`}
          hint={project ? 'Follows the project.' : undefined}
        >
          <Select
            id={`${id}-client_id`}
            placeholder="No client"
            options={clientOptions}
            value={project ? project.client_id : values.client_id}
            onChange={(event) => onChange('client_id', event.target.value)}
            disabled={Boolean(project)}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor={`${id}-description`}>
        <Textarea
          id={`${id}-description`}
          rows={5}
          value={values.description}
          onChange={(event) => onChange('description', event.target.value)}
          placeholder="Details, links, acceptance criteria"
        />
      </Field>
    </form>
  );
}
