import type { SelectOption } from '@/components/Input';
import type { Enums } from './database.types';

/** Shared by leads and clients (both use the lead_industry enum). */
export type Industry = Enums<'lead_industry'>;

export const INDUSTRY_LABELS: Record<Industry, string> = {
  salon: 'Salon',
  dental: 'Dental',
  medical: 'Medical',
  guest_house: 'Guest house',
  construction: 'Construction',
  bookkeeping: 'Bookkeeping',
  real_estate: 'Real estate',
  cleaning: 'Cleaning',
  driving_school: 'Driving school',
  gym: 'Gym',
  legal: 'Legal',
  other: 'Other',
};

export function toOptions<T extends string>(labels: Record<T, string>): SelectOption<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

export const INDUSTRY_OPTIONS = toOptions(INDUSTRY_LABELS);
