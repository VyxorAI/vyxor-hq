import { addDaysISO, todayISO } from '@/lib/format';
import { moneyInput, parseMoney } from '@/lib/validation';
import type { Invoice, InvoicePayload, InvoiceStatus, InvoiceType } from '../types';

export interface InvoiceFormValues {
  client_id: string;
  number: string;
  type: InvoiceType;
  amount: string;
  issued_on: string;
  due_on: string;
  status: InvoiceStatus;
  paid_on: string;
}

export type InvoiceFormErrors = Partial<Record<keyof InvoiceFormValues, string>>;

/** Payment terms for new invoices. */
export const DEFAULT_TERMS_DAYS = 7;

export function toInvoiceFormValues(invoice: Invoice | undefined, defaults: { clientId?: string; amount?: number | null } = {}): InvoiceFormValues {
  const issued = invoice?.issued_on ?? todayISO();
  return {
    client_id: invoice?.client_id ?? defaults.clientId ?? '',
    number: invoice?.number ?? '',
    type: invoice?.type ?? 'retainer',
    amount: invoice ? moneyInput(invoice.amount) : moneyInput(defaults.amount),
    issued_on: issued,
    due_on: invoice ? (invoice.due_on ?? '') : addDaysISO(issued, DEFAULT_TERMS_DAYS),
    // Stored "overdue" is edited as "sent"; the app shows overdue from the due date
    status: invoice?.status === 'overdue' ? 'sent' : (invoice?.status ?? 'draft'),
    paid_on: invoice?.paid_on ?? '',
  };
}

export function validateInvoice(values: InvoiceFormValues): InvoiceFormErrors {
  const errors: InvoiceFormErrors = {};
  if (!values.client_id) errors.client_id = 'Choose the client.';
  const amount = parseMoney(values.amount);
  if (amount === null) errors.amount = 'Add the amount.';
  else if (Number.isNaN(amount) || amount <= 0) errors.amount = 'Use a number above zero, e.g. 2500.';
  if (!values.issued_on) errors.issued_on = 'Add the issue date.';
  if (values.due_on && values.issued_on && values.due_on < values.issued_on) {
    errors.due_on = "The due date can't be before the issue date.";
  }
  return errors;
}

export function toInvoicePayload(values: InvoiceFormValues): InvoicePayload {
  const paid = values.status === 'paid';
  return {
    client_id: values.client_id,
    // Empty: the database numbers it (VX-<year>-001)
    ...(values.number.trim() ? { number: values.number.trim() } : {}),
    type: values.type,
    amount: parseMoney(values.amount) ?? 0,
    issued_on: values.issued_on,
    due_on: values.due_on || null,
    status: values.status,
    paid_on: paid ? values.paid_on || todayISO() : null,
  };
}
