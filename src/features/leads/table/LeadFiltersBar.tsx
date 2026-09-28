import { FilterX, Search } from 'lucide-react';
import { Button } from '@/components/Button';
import { Select } from '@/components/Input';
import { useProfiles } from '@/features/auth/profiles';
import { INDUSTRY_OPTIONS, OFFER_OPTIONS, STAGE_OPTIONS } from '../constants';
import type { FilterKey, LeadFilters } from './filters';

interface LeadFiltersBarProps {
  filters: LeadFilters;
  activeCount: number;
  onChange: (key: FilterKey, value: string) => void;
  onClear: () => void;
}

export function LeadFiltersBar({ filters, activeCount, onChange, onClear }: LeadFiltersBarProps) {
  const { data: profiles = [] } = useProfiles();
  const ownerOptions = [
    ...profiles.map((profile) => ({ value: profile.id, label: profile.full_name })),
    { value: 'none', label: 'No owner' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <div className="relative col-span-2 sm:w-56">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={filters.q}
          onChange={(event) => onChange('q', event.target.value)}
          placeholder="Search name, contact, email"
          aria-label="Search leads"
          className="h-9 w-full rounded-control border border-border bg-raised pr-3 pl-8 text-sm text-primary focus:border-accent-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
        />
      </div>
      <Select
        aria-label="Filter by stage"
        placeholder="All stages"
        options={STAGE_OPTIONS}
        value={filters.stage}
        onChange={(event) => onChange('stage', event.target.value)}
        className="sm:w-40"
      />
      <Select
        aria-label="Filter by industry"
        placeholder="All industries"
        options={INDUSTRY_OPTIONS}
        value={filters.industry}
        onChange={(event) => onChange('industry', event.target.value)}
        className="sm:w-40"
      />
      <Select
        aria-label="Filter by offer"
        placeholder="All offers"
        options={OFFER_OPTIONS}
        value={filters.offer}
        onChange={(event) => onChange('offer', event.target.value)}
        className="sm:w-48"
      />
      <Select
        aria-label="Filter by owner"
        placeholder="All owners"
        options={ownerOptions}
        value={filters.owner}
        onChange={(event) => onChange('owner', event.target.value)}
        className="sm:w-36"
      />
      {activeCount > 0 && (
        <Button variant="ghost" icon={FilterX} onClick={onClear} className="col-span-2 sm:col-span-1">
          Clear filters
        </Button>
      )}
    </div>
  );
}
