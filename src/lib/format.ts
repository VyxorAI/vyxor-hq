const zarNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** ZAR as `R 12,500`. Empty values render as an en dash. */
export function formatZAR(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '–';
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}R ${zarNumber.format(Math.abs(rounded))}`;
}

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** Short ZAR for axes: `R 12.5K`, `R 1.2M`. */
export function formatZARCompact(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}R ${compactNumber.format(Math.abs(value))}`;
}

const relativeTime = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });

/** "just now", "5 minutes ago", "yesterday", "3 days ago"; older than a week shows the date. */
export function formatRelative(timestamp: string): string {
  const seconds = Math.round((new Date(timestamp).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return 'just now';
  if (abs < 3600) return relativeTime.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return relativeTime.format(Math.round(seconds / 3600), 'hour');
  if (abs < 7 * 86400) return relativeTime.format(Math.round(seconds / 86400), 'day');
  return formatShortDate(timestamp.slice(0, 10));
}

/** Today's date in local time as `YYYY-MM-DD`, matching Postgres `date` values. */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const shortDateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/** Parse a `YYYY-MM-DD` date as a local date (not UTC); full timestamps parse as-is. */
function parseDate(iso: string): Date {
  if (iso.length > 10) return new Date(iso);
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** `28 Sep 2026` */
export function formatDate(iso: string | null | undefined): string {
  return iso ? dateFormat.format(parseDate(iso)) : '–';
}

/** `28 Sep`, adding the year only when it isn't this year. */
export function formatShortDate(iso: string): string {
  const date = parseDate(iso);
  return date.getFullYear() === new Date().getFullYear() ? shortDateFormat.format(date) : dateFormat.format(date);
}

/** `YYYY-MM-DD` plus n days (local dates). */
export function addDaysISO(iso: string, days: number): string {
  const date = parseDate(iso);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const weekdayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

/** "Today", "Tomorrow", or "Wednesday 1 Oct". */
export function formatDayHeading(iso: string): string {
  const today = todayISO();
  if (iso === today) return 'Today';
  if (iso === addDaysISO(today, 1)) return 'Tomorrow';
  return weekdayFormat.format(parseDate(iso)).replace(',', '');
}

export type DueState = 'overdue' | 'today' | 'upcoming';

export function dueState(iso: string): DueState {
  const today = todayISO();
  if (iso < today) return 'overdue';
  if (iso === today) return 'today';
  return 'upcoming';
}

/** First letters of the first two words: "Carl Veden" -> "CV". */
export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}
