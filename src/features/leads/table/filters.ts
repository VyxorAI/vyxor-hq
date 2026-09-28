import type { Profile } from '@/features/auth/profiles';
import { sortBy, type SortState, type SortValue } from '@/lib/sort';
import { oneOf, useUrlFilters } from '@/lib/useUrlFilters';
import { INDUSTRY_LABELS, OFFER_LABELS, STAGE_ORDER } from '../constants';
import type { Lead, LeadIndustry, LeadOffer, LeadStage } from '../types';

export interface LeadFilters {
  q: string;
  industry: LeadIndustry | '';
  offer: LeadOffer | '';
  owner: string;
  stage: LeadStage | '';
}

export type FilterKey = keyof LeadFilters;

const FILTER_KEYS: readonly FilterKey[] = ['q', 'industry', 'offer', 'owner', 'stage'];

export function useLeadFilters() {
  const { values, setFilter, clearFilters, activeCount } = useUrlFilters(FILTER_KEYS);

  const filters: LeadFilters = {
    q: values.q,
    industry: oneOf(values.industry, Object.keys(INDUSTRY_LABELS) as LeadIndustry[]),
    offer: oneOf(values.offer, Object.keys(OFFER_LABELS) as LeadOffer[]),
    owner: values.owner,
    stage: oneOf(values.stage, STAGE_ORDER),
  };

  return { filters, setFilter, clearFilters, activeCount };
}

export function filterLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  const query = filters.q.trim().toLowerCase();
  return leads.filter((lead) => {
    if (filters.industry && lead.industry !== filters.industry) return false;
    if (filters.offer && lead.offer !== filters.offer) return false;
    if (filters.stage && lead.stage !== filters.stage) return false;
    if (filters.owner === 'none' ? lead.owner_id !== null : filters.owner && lead.owner_id !== filters.owner) return false;
    if (query) {
      const haystack = [lead.business_name, lead.contact_name, lead.email, lead.phone].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export type SortKey =
  | 'business_name'
  | 'stage'
  | 'industry'
  | 'offer'
  | 'estimated_monthly'
  | 'estimated_setup_fee'
  | 'next_follow_up'
  | 'owner';

/** Money columns start with the biggest first. */
export const DESCENDING_FIRST: readonly SortKey[] = ['estimated_monthly', 'estimated_setup_fee'];

function sortValue(lead: Lead, key: SortKey, profiles: Map<string, Profile>): SortValue {
  switch (key) {
    case 'business_name':
      return lead.business_name.toLowerCase();
    case 'stage':
      return STAGE_ORDER.indexOf(lead.stage);
    case 'industry':
      return INDUSTRY_LABELS[lead.industry];
    case 'offer':
      return OFFER_LABELS[lead.offer];
    case 'estimated_monthly':
      return lead.estimated_monthly;
    case 'estimated_setup_fee':
      return lead.estimated_setup_fee;
    case 'next_follow_up':
      return lead.next_follow_up;
    case 'owner':
      return lead.owner_id ? profiles.get(lead.owner_id)?.full_name : null;
  }
}

export function sortLeads(leads: Lead[], sort: SortState<SortKey>, profiles: Map<string, Profile>): Lead[] {
  return sortBy(
    leads,
    sort.direction,
    (lead) => sortValue(lead, sort.key, profiles),
    (a, b) => a.business_name.localeCompare(b.business_name),
  );
}
