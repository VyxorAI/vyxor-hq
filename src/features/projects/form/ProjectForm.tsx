import type { FormEvent } from 'react';
import { Field } from '@/components/Field';
import { Input, Select, Textarea } from '@/components/Input';
import { useClients } from '@/features/clients/api';
import { PROJECT_STATUS_OPTIONS, PROJECT_TYPE_OPTIONS } from '../constants';
import type { ProjectFormErrors, ProjectFormValues } from './projectFormModel';

interface ProjectFormProps {
  id: string;
  values: ProjectFormValues;
  errors: ProjectFormErrors;
  onChange: <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => void;
  onSubmit: () => void;
}

export function ProjectForm({ id, values, errors, onChange, onSubmit }: ProjectFormProps) {
  const { data: clients = [] } = useClients();
  const clientOptions = clients.map((client) => ({ value: client.id, label: client.business_name }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  const invalid = (key: keyof ProjectFormValues) => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `${id}-${key}-error` : undefined,
  });

  return (
    <form id={id} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Project name" htmlFor={`${id}-name`} error={errors.name} required>
        <Input
          id={`${id}-name`}
          value={values.name}
          onChange={(event) => onChange('name', event.target.value)}
          placeholder="e.g. WhatsApp booking agent"
          data-autofocus
          {...invalid('name')}
        />
      </Field>
      <Field label="Client" htmlFor={`${id}-client_id`} error={errors.client_id} required>
        <Select
          id={`${id}-client_id`}
          placeholder="Choose a client"
          options={clientOptions}
          value={values.client_id}
          onChange={(event) => onChange('client_id', event.target.value)}
          {...invalid('client_id')}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Type" htmlFor={`${id}-type`}>
          <Select
            id={`${id}-type`}
            options={PROJECT_TYPE_OPTIONS}
            value={values.type}
            onChange={(event) => onChange('type', event.target.value as ProjectFormValues['type'])}
          />
        </Field>
        <Field label="Status" htmlFor={`${id}-status`}>
          <Select
            id={`${id}-status`}
            options={PROJECT_STATUS_OPTIONS}
            value={values.status}
            onChange={(event) => onChange('status', event.target.value as ProjectFormValues['status'])}
          />
        </Field>
        <Field label="Start date" htmlFor={`${id}-start_date`}>
          <Input
            id={`${id}-start_date`}
            type="date"
            value={values.start_date}
            onChange={(event) => onChange('start_date', event.target.value)}
          />
        </Field>
        <Field label="Due date" htmlFor={`${id}-due_date`} error={errors.due_date}>
          <Input
            id={`${id}-due_date`}
            type="date"
            value={values.due_date}
            onChange={(event) => onChange('due_date', event.target.value)}
            {...invalid('due_date')}
          />
        </Field>
      </div>
      <Field label="Description" htmlFor={`${id}-description`}>
        <Textarea
          id={`${id}-description`}
          rows={5}
          value={values.description}
          onChange={(event) => onChange('description', event.target.value)}
          placeholder="Scope, deliverables, links"
        />
      </Field>
    </form>
  );
}
