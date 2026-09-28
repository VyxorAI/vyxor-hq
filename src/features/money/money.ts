// Money calculations. Cash basis: revenue counts in the month an invoice is paid.
import { todayISO } from '@/lib/format';
import type { Expense, Invoice, InvoiceStatus, InvoiceType } from './types';

/** `YYYY-MM` of a `YYYY-MM-DD` date. */
export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonth(): string {
  return monthOf(todayISO());
}

/** The last `count` months ending with the current one, oldest first. */
export function lastMonths(count: number, end = currentMonth()): string[] {
  const [year, month] = end.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(year, month - 1 - (count - 1 - i), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
}

const monthShort = new Intl.DateTimeFormat('en-GB', { month: 'short' });
const monthLong = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

export function formatMonth(month: string, style: 'short' | 'long' = 'short'): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1, 1);
  return style === 'short' ? monthShort.format(date) : monthLong.format(date);
}

/** Status as shown: a sent invoice past its due date is overdue. */
export function displayStatus(invoice: Invoice, today = todayISO()): InvoiceStatus {
  if (invoice.status === 'sent' && invoice.due_on && invoice.due_on < today) return 'overdue';
  return invoice.status;
}

export function isOutstanding(invoice: Invoice): boolean {
  return invoice.status === 'sent' || invoice.status === 'overdue';
}

export function sumAmounts(items: Array<{ amount: number }>): number {
  return items.reduce((sum, item) => sum + Number(item.amount), 0);
}

/** Invoices paid in a month, optionally of one type. */
export function paidIn(invoices: Invoice[], month: string, type?: InvoiceType): Invoice[] {
  return invoices.filter(
    (invoice) => invoice.paid_on !== null && monthOf(invoice.paid_on) === month && (!type || invoice.type === type),
  );
}

/** Once-off expenses count in their month; recurring ones every month from `date` to `ends_on`. */
export function expenseCountsIn(expense: Expense, month: string): boolean {
  const start = monthOf(expense.date);
  if (!expense.recurring) return start === month;
  return start <= month && (!expense.ends_on || monthOf(expense.ends_on) >= month);
}

/** Total spent on an expense up to and including `upTo` (recurring ones once per month). */
export function costToDate(expense: Expense, upTo = currentMonth()): number {
  const start = monthOf(expense.date);
  if (start > upTo) return 0;
  if (!expense.recurring) return Number(expense.amount);
  const end = expense.ends_on && monthOf(expense.ends_on) < upTo ? monthOf(expense.ends_on) : upTo;
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  const months = (ey - sy) * 12 + (em - sm) + 1;
  return Math.max(months, 0) * Number(expense.amount);
}

export function expensesIn(expenses: Expense[], month: string): number {
  return sumAmounts(expenses.filter((expense) => expenseCountsIn(expense, month)));
}

export interface MonthPoint {
  month: string;
  label: string;
  retainer: number;
  setup: number;
  other: number;
  revenue: number;
  expenses: number;
  profit: number;
}

/** Revenue by type and expenses for each of the last `count` months. */
export function monthlySeries(invoices: Invoice[], expenses: Expense[], count = 12): MonthPoint[] {
  return lastMonths(count).map((month) => {
    const retainer = sumAmounts(paidIn(invoices, month, 'retainer'));
    const setup = sumAmounts(paidIn(invoices, month, 'setup'));
    const other = sumAmounts(paidIn(invoices, month, 'other'));
    const spend = expensesIn(expenses, month);
    const revenue = retainer + setup + other;
    return { month, label: formatMonth(month), retainer, setup, other, revenue, expenses: spend, profit: revenue - spend };
  });
}

export interface MoneySummary {
  setupThisMonth: number;
  outstanding: number;
  outstandingCount: number;
  overdueCount: number;
  revenueThisMonth: number;
  expensesThisMonth: number;
  profitThisMonth: number;
}

export function summarise(invoices: Invoice[], expenses: Expense[]): MoneySummary {
  const month = currentMonth();
  const today = todayISO();
  const outstanding = invoices.filter(isOutstanding);
  const revenueThisMonth = sumAmounts(paidIn(invoices, month));
  const expensesThisMonth = expensesIn(expenses, month);
  return {
    setupThisMonth: sumAmounts(paidIn(invoices, month, 'setup')),
    outstanding: sumAmounts(outstanding),
    outstandingCount: outstanding.length,
    overdueCount: outstanding.filter((invoice) => displayStatus(invoice, today) === 'overdue').length,
    revenueThisMonth,
    expensesThisMonth,
    profitThisMonth: revenueThisMonth - expensesThisMonth,
  };
}

/** Active clients with a retainer that have no retainer invoice issued this month. */
export function clientsNeedingRetainerInvoice<C extends { id: string; status: string; monthly_retainer: number | null }>(
  clients: C[],
  invoices: Invoice[],
  month = currentMonth(),
): C[] {
  const invoiced = new Set(
    invoices
      .filter((invoice) => invoice.type === 'retainer' && monthOf(invoice.issued_on) === month)
      .map((invoice) => invoice.client_id),
  );
  return clients.filter(
    (client) => client.status === 'active' && (client.monthly_retainer ?? 0) > 0 && !invoiced.has(client.id),
  );
}
