import type { Profile } from '@/features/auth/profiles';
import { INDUSTRY_LABELS } from '@/lib/labels';
import { sortBy, type SortState, type SortValue } from '@/lib/sort';
import { oneOf, useUrlFilters } from '@/lib/useUrlFilters';
import { STATUS_ORDER } from '../constants';
import type { Client, ClientStatus } from '../types';

export interface ClientFilters {
  q: string;
  status: ClientStatus | '';
  owner: string;
}

export type ClientFilterKey = keyof ClientFilters;

const FILTER_KEYS: readonly ClientFilterKey[] = ['q', 'status', 'owner'];

export function useClientFilters() {
  const { values, setFilter, clearFilters, activeCount } = useUrlFilters(FILTER_KEYS);
  const filters: ClientFilters = {
    q: values.q,
    status: oneOf(values.status, STATUS_ORDER),
    owner: values.owner,
  };
  return { filters, setFilter, clearFilters, activeCount };
}

export function filterClients(clients: Client[], filters: ClientFilters): Client[] {
  const query = filters.q.trim().toLowerCase();
  return clients.filter((client) => {
    if (filters.status && client.status !== filters.status) return false;
    if (filters.owner === 'none' ? client.owner_id !== null : filters.owner && client.owner_id !== filters.owner) {
      return false;
    }
    if (query) {
      const haystack = [client.business_name, client.contact_name, client.email, client.phone, client.package]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export type ClientSortKey =
  | 'business_name'
  | 'industry'
  | 'package'
  | 'monthly_retainer'
  | 'status'
  | 'start_date'
  | 'owner';

export const DESCENDING_FIRST: readonly ClientSortKey[] = ['monthly_retainer', 'start_date'];

function sortValue(client: Client, key: ClientSortKey, profiles: Map<string, Profile>): SortValue {
  switch (key) {
    case 'business_name':
      return client.business_name.toLowerCase();
    case 'industry':
      return INDUSTRY_LABELS[client.industry];
    case 'package':
      return client.package?.toLowerCase();
    case 'monthly_retainer':
      return client.monthly_retainer;
    case 'status':
      return STATUS_ORDER.indexOf(client.status);
    case 'start_date':
      return client.start_date;
    case 'owner':
      return client.owner_id ? profiles.get(client.owner_id)?.full_name : null;
  }
}

export function sortClients(clients: Client[], sort: SortState<ClientSortKey>, profiles: Map<string, Profile>): Client[] {
  return sortBy(
    clients,
    sort.direction,
    (client) => sortValue(client, sort.key, profiles),
    (a, b) => a.business_name.localeCompare(b.business_name),
  );
}

/** MRR: sum of retainers of active clients. */
export function monthlyRecurring(clients: Client[]): number {
  return clients
    .filter((client) => client.status === 'active')
    .reduce((sum, client) => sum + (client.monthly_retainer ?? 0), 0);
}
