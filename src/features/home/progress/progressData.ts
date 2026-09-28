// Progress over time for the home chart. Cash basis, like the Money page:
// revenue counts when an invoice is paid.
import type { Client } from '@/features/clients/types';
import type { Lead } from '@/features/leads/types';
import { currentMonth, expenseCountsIn, lastMonths, monthOf } from '@/features/money/money';
import type { Expense, Invoice } from '@/features/money/types';
import { addDaysISO, todayISO } from '@/lib/format';

export type Period = 'week' | 'month' | 'year';

export interface Bucket {
  key: string;
  /** Axis label: "8 Sep", "Sep", "2026". */
  label: string;
  /** Tooltip / table label: "Week of 8 Sep 2026", "September 2026". */
  longLabel: string;
  /** Inclusive local dates, YYYY-MM-DD. */
  start: string;
  end: string;
}

const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const dayMonthYear = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const monthShort = new Intl.DateTimeFormat('en-GB', { month: 'short' });
const monthLong = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

function localDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** A timestamp as a local YYYY-MM-DD date. */
function localDay(timestamp: string): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Monday of the week containing `iso`. */
function weekStart(iso: string): string {
  const offset = (localDate(iso).getDay() + 6) % 7;
  return addDaysISO(iso, -offset);
}

function lastDayOfMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
}

/**
 * Last 12 weeks (Mon to Sun), last 12 months, or every year since the first
 * record. The final bucket is the current, still-running period.
 */
export function buildBuckets(period: Period, firstYear: number): Bucket[] {
  const today = todayISO();
  if (period === 'week') {
    const thisWeek = weekStart(today);
    return Array.from({ length: 12 }, (_, i) => {
      const start = addDaysISO(thisWeek, (i - 11) * 7);
      return {
        key: start,
        label: dayMonth.format(localDate(start)),
        longLabel: `Week of ${dayMonthYear.format(localDate(start))}`,
        start,
        end: addDaysISO(start, 6),
      };
    });
  }
  if (period === 'month') {
    return lastMonths(12).map((month) => ({
      key: month,
      label: monthShort.format(localDate(`${month}-01`)),
      longLabel: monthLong.format(localDate(`${month}-01`)),
      start: `${month}-01`,
      end: lastDayOfMonth(month),
    }));
  }
  const thisYear = Number(today.slice(0, 4));
  const from = Math.min(firstYear, thisYear);
  return Array.from({ length: thisYear - from + 1 }, (_, i) => {
    const year = String(from + i);
    return { key: year, label: year, longLabel: year, start: `${year}-01-01`, end: `${year}-12-31` };
  });
}

const within = (day: string, bucket: Bucket) => day >= bucket.start && day <= bucket.end;

/**
 * What an expense costs within a bucket. Recurring (monthly) costs count per
 * month they run; in weekly view a monthly cost is spread as 12/52 per week.
 */
function expenseIn(expense: Expense, bucket: Bucket, period: Period): number {
  const amount = Number(expense.amount);
  if (!expense.recurring) return within(expense.date, bucket) ? amount : 0;
  if (period === 'week') return expenseCountsIn(expense, monthOf(bucket.start)) ? (amount * 12) / 52 : 0;
  if (period === 'month') return expenseCountsIn(expense, monthOf(bucket.start)) ? amount : 0;
  // Year: each month that has started so far
  const year = bucket.start.slice(0, 4);
  const now = currentMonth();
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
    .filter((month) => month <= now && expenseCountsIn(expense, month))
    .reduce((sum) => sum + amount, 0);
}

/** One period on the chart; `values` is keyed by series (revenue, profit, leads…). */
export interface ProgressPoint {
  key: string;
  label: string;
  longLabel: string;
  values: Record<string, number>;
}

/** Revenue paid in, expenses and profit per period (ZAR). */
export function moneySeries(buckets: Bucket[], period: Period, invoices: Invoice[], expenses: Expense[]): ProgressPoint[] {
  return buckets.map((bucket) => {
    const revenue = invoices
      .filter((invoice) => invoice.paid_on && within(invoice.paid_on, bucket))
      .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const spend = expenses.reduce((sum, expense) => sum + expenseIn(expense, bucket, period), 0);
    return {
      key: bucket.key,
      label: bucket.label,
      longLabel: bucket.longLabel,
      values: { revenue, expenses: Math.round(spend), profit: Math.round(revenue - spend) },
    };
  });
}

/** New leads and new clients per period (counts). */
export function growthSeries(buckets: Bucket[], leads: Lead[], clients: Client[]): ProgressPoint[] {
  return buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    longLabel: bucket.longLabel,
    values: {
      leads: leads.filter((lead) => within(localDay(lead.created_at), bucket)).length,
      clients: clients.filter((client) => within(localDay(client.created_at), bucket)).length,
    },
  }));
}

/** Earliest year with any record, for the yearly view. */
export function firstDataYear(dates: string[]): number {
  const years = dates.filter(Boolean).map((date) => Number(date.slice(0, 4)));
  return years.length > 0 ? Math.min(...years) : Number(todayISO().slice(0, 4));
}
