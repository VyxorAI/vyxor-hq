import { lazy, Suspense } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { useStoredState } from '@/components/shell/useStoredState';
import { Spinner } from '@/components/Spinner';
import { cn } from '@/lib/cn';
import { formatZAR } from '@/lib/format';
import { formatMonth, type MonthPoint } from '../money';
import { SERIES } from './series';

// Recharts is large; load it only when the chart is on screen
const RevenueChart = lazy(() => import('./RevenueChart').then((module) => ({ default: module.RevenueChart })));

type View = 'chart' | 'table';

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legend">
      {SERIES.map((series) => (
        <li key={series.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={series.mark === 'bar' ? 'size-2.5 rounded-[2px]' : 'h-0.5 w-3 rounded-full'}
            style={{ background: series.color }}
          />
          {series.label}
        </li>
      ))}
    </ul>
  );
}

function RevenueTable({ data }: { data: MonthPoint[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-right text-sm tabular-nums">
        <thead className="border-b border-border text-xs text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">Month</th>
            {SERIES.map((series) => (
              <th key={series.key} scope="col" className="px-3 py-2 font-medium">{series.label}</th>
            ))}
            <th scope="col" className="px-3 py-2 font-medium">Profit</th>
          </tr>
        </thead>
        <tbody>
          {[...data].reverse().map((point) => (
            <tr key={point.month} className="border-b border-border last:border-b-0">
              <th scope="row" className="px-3 py-2 text-left font-normal">{formatMonth(point.month, 'long')}</th>
              {SERIES.map((series) => (
                <td key={series.key} className="px-3 py-2 text-muted">{formatZAR(point[series.key])}</td>
              ))}
              <td className="px-3 py-2 font-medium">{formatZAR(point.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** "Revenue, last 12 months" with a chart / table toggle (remembered per browser). */
export function RevenueCard({ data }: { data: MonthPoint[] }) {
  const [view, setView] = useStoredState<View>('vyxor:revenue-view', 'chart');
  const empty = data.every((point) => point.revenue === 0 && point.expenses === 0);

  return (
    <section aria-labelledby="revenue-title" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h2 id="revenue-title" className="text-md">Revenue, last 12 months</h2>
          <Legend />
        </div>
        <div role="group" aria-label="Show as" className="inline-flex rounded-control border border-border p-0.5">
          {([
            { value: 'chart', label: 'Chart', icon: BarChart3 },
            { value: 'table', label: 'Table', icon: Table2 },
          ] as const).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition-colors',
                view === value ? 'bg-raised text-primary' : 'text-muted hover:text-primary',
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      {empty ? (
        <p className="py-12 text-center text-muted">
          No paid invoices or expenses in the last 12 months yet. Mark an invoice as paid to see it here.
        </p>
      ) : view === 'chart' ? (
        <Suspense
          fallback={
            <div className="flex h-72 items-center justify-center">
              <Spinner label="Loading chart" />
            </div>
          }
        >
          <RevenueChart data={data} />
        </Suspense>
      ) : (
        <RevenueTable data={data} />
      )}
      <p className="text-xs text-muted">Revenue counts in the month an invoice is paid.</p>
    </section>
  );
}
