import type { BadgeTone } from '@/components/Badge';
import type { SelectOption } from '@/components/Input';
import { toOptions } from '@/lib/labels';
import type { ExpenseCategory, InvoiceStatus, InvoiceType } from './types';

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  retainer: 'Retainer',
  setup: 'Setup fee',
  other: 'Other',
};
export const INVOICE_TYPE_OPTIONS = toOptions(INVOICE_TYPE_LABELS);

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'blue' },
  paid: { label: 'Paid', tone: 'teal' },
  overdue: { label: 'Overdue', tone: 'danger' },
};

/** Status choices in the form; "overdue" is shown automatically, not picked. */
export const INVOICE_STATUS_OPTIONS: SelectOption<InvoiceStatus>[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
];

/** Filter choices include overdue. */
export const INVOICE_STATUS_FILTER_OPTIONS: SelectOption<InvoiceStatus>[] = [
  ...INVOICE_STATUS_OPTIONS,
  { value: 'overdue', label: 'Overdue' },
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  hosting: 'Hosting',
  api: 'API usage',
  software: 'Software',
  marketing: 'Marketing',
  other: 'Other',
};
export const EXPENSE_CATEGORY_OPTIONS = toOptions(EXPENSE_CATEGORY_LABELS);

/**
 * Chart series colours, validated with the dataviz palette checker against the
 * dark card surface (#0E1530): lightness band, chroma, CVD and contrast all pass.
 * Fixed order: retainer, setup, other, expenses.
 */
export const SERIES_COLORS = {
  retainer: '#2F7BFF',
  setup: '#0FA894',
  other: '#8B5CF6',
  expenses: '#D9712F',
} as const;
