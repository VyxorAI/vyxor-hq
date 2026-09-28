import type { FormEvent } from 'react';
import { Field } from '@/components/Field';
import { Input, Select } from '@/components/Input';
import { useClients } from '@/features/clients/api';
import { INVOICE_STATUS_OPTIONS, INVOICE_TYPE_OPTIONS } from '../constants';
import type { InvoiceFormErrors, InvoiceFormValues } from './invoiceFormModel';

interface InvoiceFormProps {
  id: string;
  values: InvoiceFormValues;
  errors: InvoiceFormErrors;
  onChange: <K extends keyof InvoiceFormValues>(key: K, value: InvoiceFormValues[K]) => void;
  onSubmit: () => void;
}

export function InvoiceForm({ id, values, errors, onChange, onSubmit }: InvoiceFormProps) {
  const { data: clients = [] } = useClients();
  const clientOptions = clients.map((client) => ({ value: client.id, label: client.business_name }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  const invalid = (key: keyof InvoiceFormValues) => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `${id}-${key}-error` : undefined,
  });

  return (
    <form id={id} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Client" htmlFor={`${id}-client_id`} error={errors.client_id} required>
        <Select
          id={`${id}-client_id`}
          placeholder="Choose a client"
          options={clientOptions}
          value={values.client_id}
          onChange={(event) => onChange('client_id', event.target.value)}
          data-autofocus
          {...invalid('client_id')}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Type" htmlFor={`${id}-type`}>
          <Select
            id={`${id}-type`}
            options={INVOICE_TYPE_OPTIONS}
            value={values.type}
            onChange={(event) => onChange('type', event.target.value as InvoiceFormValues['type'])}
          />
        </Field>
        <Field label="Amount (R)" htmlFor={`${id}-amount`} error={errors.amount} required>
          <Input
            id={`${id}-amount`}
            inputMode="decimal"
            placeholder="2500"
            value={values.amount}
            onChange={(event) => onChange('amount', event.target.value)}
            {...invalid('amount')}
          />
        </Field>
        <Field label="Issued on" htmlFor={`${id}-issued_on`} error={errors.issued_on} required>
          <Input
            id={`${id}-issued_on`}
            type="date"
            value={values.issued_on}
            onChange={(event) => onChange('issued_on', event.target.value)}
            {...invalid('issued_on')}
          />
        </Field>
        <Field label="Due on" htmlFor={`${id}-due_on`} error={errors.due_on}>
          <Input
            id={`${id}-due_on`}
            type="date"
            value={values.due_on}
            onChange={(event) => onChange('due_on', event.target.value)}
            {...invalid('due_on')}
          />
        </Field>
        <Field label="Status" htmlFor={`${id}-status`} hint="Sent invoices past their due date show as overdue.">
          <Select
            id={`${id}-status`}
            options={INVOICE_STATUS_OPTIONS}
            value={values.status}
            onChange={(event) => onChange('status', event.target.value as InvoiceFormValues['status'])}
          />
        </Field>
        <Field label="Invoice number" htmlFor={`${id}-number`} hint="Leave empty to number it automatically.">
          <Input
            id={`${id}-number`}
            value={values.number}
            onChange={(event) => onChange('number', event.target.value)}
            placeholder="VX-2026-001"
          />
        </Field>
        {values.status === 'paid' && (
          <Field label="Paid on" htmlFor={`${id}-paid_on`} hint="Leave empty for today.">
            <Input
              id={`${id}-paid_on`}
              type="date"
              value={values.paid_on}
              onChange={(event) => onChange('paid_on', event.target.value)}
            />
          </Field>
        )}
      </div>
    </form>
  );
}
