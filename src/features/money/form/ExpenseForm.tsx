import type { FormEvent } from 'react';
import { Field } from '@/components/Field';
import { Input, Select } from '@/components/Input';
import { useClients } from '@/features/clients/api';
import { EXPENSE_CATEGORY_OPTIONS } from '../constants';
import type { ExpenseFormErrors, ExpenseFormValues } from './expenseFormModel';

interface ExpenseFormProps {
  id: string;
  values: ExpenseFormValues;
  errors: ExpenseFormErrors;
  onChange: <K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) => void;
  onSubmit: () => void;
}

export function ExpenseForm({ id, values, errors, onChange, onSubmit }: ExpenseFormProps) {
  const { data: clients = [] } = useClients();
  const clientOptions = clients.map((client) => ({ value: client.id, label: client.business_name }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  const invalid = (key: keyof ExpenseFormValues) => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `${id}-${key}-error` : undefined,
  });

  return (
    <form id={id} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Description" htmlFor={`${id}-description`} error={errors.description} required>
        <Input
          id={`${id}-description`}
          value={values.description}
          onChange={(event) => onChange('description', event.target.value)}
          placeholder="e.g. Claude API, Netlify Pro"
          data-autofocus
          {...invalid('description')}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category" htmlFor={`${id}-category`}>
          <Select
            id={`${id}-category`}
            options={EXPENSE_CATEGORY_OPTIONS}
            value={values.category}
            onChange={(event) => onChange('category', event.target.value as ExpenseFormValues['category'])}
          />
        </Field>
        <Field label="Amount (R)" htmlFor={`${id}-amount`} error={errors.amount} required>
          <Input
            id={`${id}-amount`}
            inputMode="decimal"
            placeholder="450"
            value={values.amount}
            onChange={(event) => onChange('amount', event.target.value)}
            {...invalid('amount')}
          />
        </Field>
        <Field
          label={values.recurring ? 'Starts on' : 'Date'}
          htmlFor={`${id}-date`}
          error={errors.date}
          required
        >
          <Input
            id={`${id}-date`}
            type="date"
            value={values.date}
            onChange={(event) => onChange('date', event.target.value)}
            {...invalid('date')}
          />
        </Field>
        <Field label="Client" htmlFor={`${id}-client_id`} hint="Only for costs tied to one client.">
          <Select
            id={`${id}-client_id`}
            placeholder="Agency-wide"
            options={clientOptions}
            value={values.client_id}
            onChange={(event) => onChange('client_id', event.target.value)}
          />
        </Field>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-control border border-border bg-raised/50 px-3 py-2.5">
        <input
          type="checkbox"
          checked={values.recurring}
          onChange={(event) => onChange('recurring', event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-accent-blue"
        />
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">Repeats every month</span>
          <span className="text-xs text-muted">Counted in every month from the start date until it ends.</span>
        </span>
      </label>

      {values.recurring && (
        <Field
          label="Ends on"
          htmlFor={`${id}-ends_on`}
          error={errors.ends_on}
          hint="Leave empty while it's still running. Set it when you cancel."
        >
          <Input
            id={`${id}-ends_on`}
            type="date"
            value={values.ends_on}
            onChange={(event) => onChange('ends_on', event.target.value)}
            {...invalid('ends_on')}
          />
        </Field>
      )}
    </form>
  );
}
