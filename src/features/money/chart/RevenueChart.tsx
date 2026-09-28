import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatZAR, formatZARCompact } from '@/lib/format';
import { SERIES_COLORS } from '../constants';
import { formatMonth, type MonthPoint } from '../money';
import { SERIES } from './series';

// Theme values used inside the SVG (Recharts takes raw colours)
const SURFACE = '#0E1530';
const GRID = '#22305E';
const MUTED = '#8A96BF';

type StackKey = 'retainer' | 'setup' | 'other';
const STACK: readonly StackKey[] = ['retainer', 'setup', 'other'];


interface SegmentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: MonthPoint;
}

/**
 * Stacked segment: only the top non-empty segment of a column gets 4px rounded
 * corners; a 2px surface stroke leaves a gap between segments.
 */
function segmentShape(key: StackKey) {
  return function Segment({ x = 0, y = 0, width = 0, height = 0, fill, payload }: SegmentProps) {
    if (height <= 0 || width <= 0) return <g />;
    const above = STACK.slice(STACK.indexOf(key) + 1);
    const isTop = !payload || above.every((next) => payload[next] <= 0);
    const r = isTop ? Math.min(4, height, width / 2) : 0;
    const d = [
      `M${x},${y + height}`,
      `L${x},${y + r}`,
      `Q${x},${y} ${x + r},${y}`,
      `L${x + width - r},${y}`,
      `Q${x + width},${y} ${x + width},${y + r}`,
      `L${x + width},${y + height}`,
      'Z',
    ].join(' ');
    return <path d={d} fill={fill} stroke={SURFACE} strokeWidth={2} />;
  };
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: MonthPoint }>;
}

function ChartTooltip({ active, payload }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="glass min-w-52 rounded-card px-3 py-2.5 text-xs shadow-overlay">
      <p className="mb-2 font-medium text-primary">{formatMonth(point.month, 'long')}</p>
      <dl className="flex flex-col gap-1">
        {SERIES.map((series) => (
          <div key={series.key} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-muted">
              <span
                aria-hidden
                className={series.mark === 'bar' ? 'size-2.5 rounded-[2px]' : 'h-0.5 w-3 rounded-full'}
                style={{ background: series.color }}
              />
              {series.label}
            </dt>
            <dd className="text-primary tabular-nums">{formatZAR(point[series.key])}</dd>
          </div>
        ))}
        <div className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-1.5">
          <dt className="text-muted">Profit</dt>
          <dd className="font-medium text-primary tabular-nums">{formatZAR(point.profit)}</dd>
        </div>
      </dl>
    </div>
  );
}

/** Paid revenue per month, stacked by invoice type, with monthly expenses as a line. One ZAR axis. */
export function RevenueChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Revenue and expenses for the last 12 months. The table view lists every value.">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={GRID} strokeOpacity={0.6} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: GRID }}
            tick={{ fill: MUTED, fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatZARCompact}
            tickLine={false}
            axisLine={false}
            tick={{ fill: MUTED, fontSize: 12 }}
            width={64}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: GRID, fillOpacity: 0.35 }} isAnimationActive={false} />
          {STACK.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="revenue"
              fill={SERIES_COLORS[key]}
              shape={segmentShape(key)}
              isAnimationActive={false}
            />
          ))}
          <Line
            dataKey="expenses"
            type="linear"
            stroke={SERIES_COLORS.expenses}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: SERIES_COLORS.expenses, stroke: SURFACE, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
