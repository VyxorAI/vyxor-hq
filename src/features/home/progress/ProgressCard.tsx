import { lazy, Suspense } from 'react';
import { BarChart3, Table2, TrendingDown, TrendingUp } from 'lucide-react';
import { useStoredState } from '@/components/shell/useStoredState';
import { Spinner } from '@/components/Spinner';
import type { Client } from '@/features/clients/types';
import type { Lead } from '@/features/leads/types';
import { SERIES_COLORS } from '@/features/money/constants';
import type { Expense, Invoice } from '@/features/money/types';
import { cn } from '@/lib/cn';
import { formatZAR, formatZARCompact } from '@/lib/format';
import type { ProgressSeries } from './ProgressChart';
import { buildBuckets, firstDataYear, growthSeries, moneySeries, type Period } from './progressData';

// Shares the Recharts chunk with the Money page; loaded only when shown
const ProgressChart = lazy(() => import('./ProgressChart').then((module) => ({ default: module.ProgressChart })));

type Metric = 'money' | 'growth';
type View = 'chart' | 'table';

// Colours validated with the dataviz palette checker against the card surface
const MONEY_SERIES: readonly ProgressSeries[] = [
  { key: 'revenue', label: 'Revenue paid in', color: SERIES_COLORS.retainer },
  { key: 'profit', label: 'Profit', color: SERIES_COLORS.setup },
  { key: 'expenses', label: 'Expenses', color: SERIES_COLORS.expenses },
];
const GROWTH_SERIES: readonly ProgressSeries[] = [
  { key: 'leads', label: 'New leads', color: SERIES_COLORS.retainer },
  { key: 'clients', label: 'New clients', color: SERIES_COLORS.setup },
];

const PERIOD_WORD: Record<Period, string> = { week: 'week', month: 'month', year: 'year' };

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string; icon?: typeof BarChart3 }>;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-control border border-border p-0.5">
      {options.map(({ value: option, label: text, icon: Icon }) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition-colors',
            value === option ? 'bg-raised text-primary' : 'text-muted hover:text-primary',
          )}
        >
          {Icon && <Icon className="size-3.5" aria-hidden />}
          {text}
        </button>
      ))}
    </div>
  );
}

/**
 * "Profit this month so far R 8,000 · +R 1,200 vs last month". The change is
 * shown as an amount, not a percentage: percentages of small or negative
 * numbers (a quiet week) are misleading. Up is good for every metric shown.
 */
function Headline({ label, current, previous, format, period }: { label: string; current: number; previous: number | undefined; format: (value: number) => string; period: Period }) {
  const diff = previous === undefined ? null : current - previous;
  const word = PERIOD_WORD[period];
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="text-muted">
        {label} this {word} so far
      </span>
      <span className="font-display text-md font-semibold tabular-nums">{format(current)}</span>
      {diff !== null && diff !== 0 && (
        <span className={cn('inline-flex items-center gap-1 text-xs font-medium tabular-nums', diff > 0 ? 'text-accent-teal' : 'text-danger')}>
          {diff > 0 ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
          {diff > 0 ? '+' : '−'}
          {format(Math.abs(diff))} vs last {word}
        </span>
      )}
      {diff === 0 && <span className="text-xs text-muted">Same as last {word}</span>}
    </p>
  );
}

interface ProgressCardProps {
  invoices: Invoice[];
  expenses: Expense[];
  leads: Lead[];
  clients: Client[];
}

/** Home: are we making progress? Money or growth, by week, month or year. */
export function ProgressCard({ invoices, expenses, leads, clients }: ProgressCardProps) {
  const [metric, setMetric] = useStoredState<Metric>('vyxor:progress-metric', 'money');
  const [period, setPeriod] = useStoredState<Period>('vyxor:progress-period', 'month');
  const [view, setView] = useStoredState<View>('vyxor:progress-view', 'chart');

  const firstYear = firstDataYear([
    ...invoices.map((invoice) => invoice.paid_on ?? invoice.issued_on),
    ...expenses.map((expense) => expense.date),
    ...leads.map((lead) => lead.created_at),
    ...clients.map((client) => client.created_at),
  ]);
  const buckets = buildBuckets(period, firstYear);
  const isMoney = metric === 'money';
  const data = isMoney ? moneySeries(buckets, period, invoices, expenses) : growthSeries(buckets, leads, clients);
  const series = isMoney ? MONEY_SERIES : GROWTH_SERIES;
  const format = isMoney ? formatZAR : (value: number) => String(value);
  const axisFormat = isMoney ? formatZARCompact : (value: number) => String(value);

  // Headline compares the running period with the one before it
  const headlineKey = isMoney ? 'profit' : 'clients';
  const current = data[data.length - 1]?.values[headlineKey] ?? 0;
  const previous = data.length > 1 ? data[data.length - 2].values[headlineKey] : undefined;
  const empty = data.every((point) => series.every((line) => !point.values[line.key]));

  return (
    <section aria-labelledby="progress-title" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="progress-title" className="text-md">
            Progress
          </h2>
          <Headline
            label={isMoney ? 'Profit' : 'New clients'}
            current={current}
            previous={previous}
            format={format}
            period={period}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmented
            label="Measure"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'money', label: 'Money' },
              { value: 'growth', label: 'Growth' },
            ]}
          />
          <Segmented
            label="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'week', label: 'Weekly' },
              { value: 'month', label: 'Monthly' },
              { value: 'year', label: 'Yearly' },
            ]}
          />
          <Segmented
            label="Show as"
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: 'Chart', icon: BarChart3 },
              { value: 'table', label: 'Table', icon: Table2 },
            ]}
          />
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legend">
        {series.map((line) => (
          <li key={line.key} className="flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: line.color }} />
            {line.label}
          </li>
        ))}
      </ul>

      {empty ? (
        <p className="py-12 text-center text-muted">
          {isMoney
            ? 'No paid invoices or expenses in this range yet. Mark an invoice as paid to start the line.'
            : 'No new leads or clients in this range yet.'}
        </p>
      ) : view === 'chart' ? (
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <Spinner label="Loading chart" />
            </div>
          }
        >
          <ProgressChart
            data={data}
            series={series}
            format={format}
            axisFormat={axisFormat}
            integers={!isMoney}
          />
        </Suspense>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-right text-sm tabular-nums">
            <thead className="border-b border-border text-xs text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">
                  {PERIOD_WORD[period].charAt(0).toUpperCase() + PERIOD_WORD[period].slice(1)}
                </th>
                {series.map((line) => (
                  <th key={line.key} scope="col" className="px-3 py-2 font-medium">
                    {line.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((point) => (
                <tr key={point.key} className="border-b border-border last:border-b-0">
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    {point.longLabel}
                  </th>
                  {series.map((line) => (
                    <td key={line.key} className="px-3 py-2 text-muted">
                      {format(point.values[line.key] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted">
        {isMoney
          ? `Revenue counts when an invoice is paid.${period === 'week' ? ' Monthly costs are spread evenly across weeks.' : ''} The latest ${PERIOD_WORD[period]} is still running.`
          : `The latest ${PERIOD_WORD[period]} is still running.`}
      </p>
    </section>
  );
}
