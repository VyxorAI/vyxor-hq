import { useState } from 'react';
import { FilterX } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { SortableHeader } from '@/components/SortableHeader';
import { useProfileMap } from '@/features/auth/profiles';
import { formatZAR } from '@/lib/format';
import { toggleSort, type SortState } from '@/lib/sort';
import { FollowUpDate } from '../components/FollowUpDate';
import { OwnerAvatar } from '@/components/OwnerAvatar';
import { StageBadge } from '../components/StageBadge';
import { INDUSTRY_LABELS, OFFER_LABELS } from '../constants';
import type { Lead } from '../types';
import { DESCENDING_FIRST, filterLeads, sortLeads, useLeadFilters, type SortKey } from './filters';
import { LeadFiltersBar } from './LeadFiltersBar';

interface LeadsTableProps {
  leads: Lead[];
  onOpenLead: (id: string) => void;
}

export function LeadsTable({ leads, onOpenLead }: LeadsTableProps) {
  const profiles = useProfileMap();
  const { filters, setFilter, clearFilters, activeCount } = useLeadFilters();
  const [sort, setSort] = useState<SortState<SortKey>>({ key: 'next_follow_up', direction: 'asc' });

  // Two founders' worth of leads: cheap enough to filter and sort on every render
  const rows = sortLeads(filterLeads(leads, filters), sort, profiles);

  function handleSort(key: SortKey) {
    setSort((current) => toggleSort(current, key, DESCENDING_FIRST));
  }

  const headerProps = { sort, onSort: handleSort };

  return (
    <div className="flex flex-col gap-3">
      <LeadFiltersBar filters={filters} activeCount={activeCount} onChange={setFilter} onClear={clearFilters} />

      {rows.length === 0 ? (
        <EmptyState
          icon={FilterX}
          title="No leads match these filters"
          description="Try a different search or clear the filters."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <SortableHeader label="Business" sortKey="business_name" {...headerProps} />
                <SortableHeader label="Stage" sortKey="stage" {...headerProps} />
                <SortableHeader label="Industry" sortKey="industry" {...headerProps} />
                <SortableHeader label="Offer" sortKey="offer" {...headerProps} />
                <SortableHeader label="Monthly" sortKey="estimated_monthly" align="right" {...headerProps} />
                <SortableHeader label="Setup fee" sortKey="estimated_setup_fee" align="right" {...headerProps} />
                <SortableHeader label="Follow-up" sortKey="next_follow_up" {...headerProps} />
                <SortableHeader label="Owner" sortKey="owner" {...headerProps} />
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => {
                const owner = lead.owner_id ? profiles.get(lead.owner_id) : undefined;
                return (
                  <tr
                    key={lead.id}
                    onClick={() => onOpenLead(lead.id)}
                    className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-raised"
                  >
                    <td className="max-w-64 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenLead(lead.id);
                        }}
                        className="block max-w-full truncate text-left font-medium hover:text-accent-blue"
                      >
                        {lead.business_name}
                      </button>
                      {lead.contact_name && <p className="truncate text-xs text-muted">{lead.contact_name}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      <StageBadge stage={lead.stage} />
                    </td>
                    <td className="px-3 py-2.5 text-muted">{INDUSTRY_LABELS[lead.industry]}</td>
                    <td className="px-3 py-2.5 text-muted">{OFFER_LABELS[lead.offer]}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatZAR(lead.estimated_monthly)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                      {formatZAR(lead.estimated_setup_fee)}
                    </td>
                    <td className="px-3 py-2.5">
                      {lead.next_follow_up ? (
                        <FollowUpDate date={lead.next_follow_up} stage={lead.stage} />
                      ) : (
                        <span className="text-muted">–</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <OwnerAvatar owner={owner} />
                        <span className="text-muted">{owner?.full_name.split(' ')[0] ?? ''}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted tabular-nums">
        {rows.length} of {leads.length} leads
      </p>
    </div>
  );
}
