import { SERIES_COLORS } from '../constants';

/** Chart series in fixed order: legend, tooltip and table all read from this. */
export const SERIES = [
  { key: 'retainer', label: 'Retainers', color: SERIES_COLORS.retainer, mark: 'bar' },
  { key: 'setup', label: 'Setup fees', color: SERIES_COLORS.setup, mark: 'bar' },
  { key: 'other', label: 'Other income', color: SERIES_COLORS.other, mark: 'bar' },
  { key: 'expenses', label: 'Expenses', color: SERIES_COLORS.expenses, mark: 'line' },
] as const;
