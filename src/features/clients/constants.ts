import type { BadgeTone } from '@/components/Badge';
import type { SelectOption } from '@/components/Input';
import { OFFER_LABELS } from '@/features/leads/constants';
import type { ClientStatus } from './types';

export interface StatusMeta {
  value: ClientStatus;
  label: string;
  tone: BadgeTone;
}

export const STATUSES: readonly StatusMeta[] = [
  { value: 'onboarding', label: 'Onboarding', tone: 'blue' },
  { value: 'active', label: 'Active', tone: 'teal' },
  { value: 'paused', label: 'Paused', tone: 'warning' },
  { value: 'churned', label: 'Churned', tone: 'neutral' },
];

export const STATUS_ORDER: readonly ClientStatus[] = STATUSES.map((status) => status.value);

export const STATUS_META = Object.fromEntries(STATUSES.map((status) => [status.value, status])) as Record<
  ClientStatus,
  StatusMeta
>;

export const STATUS_OPTIONS: SelectOption<ClientStatus>[] = STATUSES.map(({ value, label }) => ({ value, label }));

/** Suggestions for the free-text package field: the offers we sell. */
export const PACKAGE_SUGGESTIONS = Object.entries(OFFER_LABELS)
  .filter(([value]) => value !== 'other')
  .map(([, label]) => label);
