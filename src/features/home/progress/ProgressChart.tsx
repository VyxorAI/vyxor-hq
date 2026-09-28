import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ProgressPoint } from './progressData';

// Theme values used inside the SVG (Recharts takes raw colours)
const SURFACE = '#0E1530';
const GRID = '#22305E';
const MUTED = '#8A96BF';

export interface ProgressSeries {
  key: string;
  label: string;
  color: string;
}

interface ProgressChartProps {
  data: ProgressPoint[];
  series: readonly ProgressSeries[];
  /** Full value format for the tooltip, e.g. "R 12,500". */
  format: (value: number) => string;
  /** Short format for the axis, e.g. "R 12.5K". */
  axisFormat: (value: number) => string;
  /** Counts only take whole-number ticks. */
  integers?: boolean;
}

interface TooltipContentProps {
  active?: boolean;
  payload?: Array<{ payload: ProgressPoint }>;
  series: readonly ProgressSeries[];
  format: (value: number) => string;
}

function TooltipContent({ active, payload, series, format }: TooltipContentProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="glass min-w-48 rounded-card px-3 py-2.5 text-xs shadow-overlay">
      <p className="mb-2 font-medium text-primary">{point.longLabel}</p>
      <dl className="flex flex-col gap-1">
        {series.map((line) => (
          <div key={line.key} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-muted">
              <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: line.color }} />
              {line.label}
            </dt>
            <dd className="text-primary tabular-nums">{format(point.values[line.key] ?? 0)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** One or more lines on a single axis, with a crosshair tooltip. */
export function ProgressChart({ data, series, format, axisFormat, integers = false }: ProgressChartProps) {
  // With very few points (e.g. the first year) show dots so single values are visible
  const showDots = data.length <= 3;

  return (
    <div className="h-64 w-full" role="img" aria-label="Progress over time. Switch to the table view for every value.">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} strokeOpacity={0.6} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: MUTED, fontSize: 12 }} interval="preserveStartEnd" />
          <YAxis
            tickFormatter={axisFormat}
            allowDecimals={!integers}
            tickLine={false}
            axisLine={false}
            tick={{ fill: MUTED, fontSize: 12 }}
            width={64}
          />
          <Tooltip
            content={<TooltipContent series={series} format={format} />}
            cursor={{ stroke: MUTED, strokeOpacity: 0.5, strokeDasharray: '3 3' }}
            isAnimationActive={false}
          />
          {series.map((line) => (
            <Line
              key={line.key}
              name={line.label}
              dataKey={(point: ProgressPoint) => point.values[line.key] ?? 0}
              type="linear"
              stroke={line.color}
              strokeWidth={2}
              dot={showDots ? { r: 4, fill: line.color, stroke: SURFACE, strokeWidth: 2 } : false}
              activeDot={{ r: 4, fill: line.color, stroke: SURFACE, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
