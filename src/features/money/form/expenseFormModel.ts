import { todayISO } from '@/lib/format';
import { moneyInput, parseMoney } from '@/lib/validation';
import type { Expense, ExpenseCategory, ExpensePayload } from '../types';

export interface ExpenseFormValues {
  description: string;
  category: ExpenseCategory;
  amount: string;
  date: string;
  recurring: boolean;
  ends_on: string;
  client_id: string;
}

export type ExpenseFormErrors = Partial<Record<keyof ExpenseFormValues, string>>;

export function toExpenseFormValues(expense: Expense | undefined, defaults: { clientId?: string } = {}): ExpenseFormValues {
  return {
    description: expense?.description ?? '',
    category: expense?.category ?? 'software',
    amount: moneyInput(expense?.amount),
    date: expense?.date ?? todayISO(),
    recurring: expense?.recurring ?? false,
    ends_on: expense?.ends_on ?? '',
    client_id: expense ? (expense.client_id ?? '') : (defaults.clientId ?? ''),
  };
}

export function validateExpense(values: ExpenseFormValues): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {};
  if (!values.description.trim()) errors.description = 'Add a description.';
  const amount = parseMoney(values.amount);
  if (amount === null) errors.amount = 'Add the amount.';
  else if (Number.isNaN(amount) || amount <= 0) errors.amount = 'Use a number above zero, e.g. 450.';
  if (!values.date) errors.date = 'Add the date.';
  if (values.recurring && values.ends_on && values.ends_on < values.date) {
    errors.ends_on = "The end date can't be before the start date.";
  }
  return errors;
}

export function toExpensePayload(values: ExpenseFormValues): ExpensePayload {
  return {
    description: values.description.trim(),
    category: values.category,
    amount: parseMoney(values.amount) ?? 0,
    date: values.date,
    recurring: values.recurring,
    ends_on: values.recurring ? values.ends_on || null : null,
    client_id: values.client_id || null,
  };
}
