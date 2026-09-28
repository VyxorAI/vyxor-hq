import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FilterX } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { SortableHeader } from '@/components/SortableHeader';
import { useProfileMap } from '@/features/auth/profiles';
import { OwnerAvatar } from '@/components/OwnerAvatar';
import { formatDate, formatZAR } from '@/lib/format';
import { INDUSTRY_LABELS } from '@/lib/labels';
import { toggleSort, type SortState } from '@/lib/sort';
import { StatusBadge } from '../components/StatusBadge';
import type { Client } from '../types';
import { ClientFiltersBar } from './ClientFiltersBar';
import { DESCENDING_FIRST, filterClients, sortClients, useClientFilters, type ClientSortKey } from './filters';

interface ClientsTableProps {
  clients: Client[];
  onOpenClient: (id: string) => void;
}

export function ClientsTable({ clients, onOpenClient }: ClientsTableProps) {
  const profiles = useProfileMap();
  const { filters, setFilter, clearFilters, activeCount } = useClientFilters();
  const [sort, setSort] = useState<SortState<ClientSortKey>>({ key: 'business_name', direction: 'asc' });

  const rows = sortClients(filterClients(clients, filters), sort, profiles);
  const headerProps = { sort, onSort: (key: ClientSortKey) => setSort((current) => toggleSort(current, key, DESCENDING_FIRST)) };

  return (
    <div className="flex flex-col gap-3">
      <ClientFiltersBar filters={filters} activeCount={activeCount} onChange={setFilter} onClear={clearFilters} />

      {rows.length === 0 ? (
        <EmptyState
          icon={FilterX}
          title="No clients match these filters"
          description="Try a different search or clear the filters."
          action={<Button onClick={clearFilters}>Clear filters</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <SortableHeader label="Client" sortKey="business_name" {...headerProps} />
                <SortableHeader label="Industry" sortKey="industry" {...headerProps} />
                <SortableHeader label="Package" sortKey="package" {...headerProps} />
                <SortableHeader label="Retainer" sortKey="monthly_retainer" align="right" {...headerProps} />
                <SortableHeader label="Status" sortKey="status" {...headerProps} />
                <SortableHeader label="Start date" sortKey="start_date" {...headerProps} />
                <SortableHeader label="Owner" sortKey="owner" {...headerProps} />
              </tr>
            </thead>
            <tbody>
              {rows.map((client) => {
                const owner = client.owner_id ? profiles.get(client.owner_id) : undefined;
                return (
                  <tr
                    key={client.id}
                    onClick={() => onOpenClient(client.id)}
                    className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-raised"
                  >
                    <td className="max-w-64 px-3 py-2.5">
                      <Link
                        to={`/clients/${client.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="block truncate font-medium hover:text-accent-blue"
                      >
                        {client.business_name}
                      </Link>
                      {client.contact_name && <p className="truncate text-xs text-muted">{client.contact_name}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-muted">{INDUSTRY_LABELS[client.industry]}</td>
                    <td className="max-w-48 truncate px-3 py-2.5 text-muted">{client.package ?? '–'}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {client.monthly_retainer ? (
                        <>
                          {formatZAR(client.monthly_retainer)}
                          <span className="text-xs text-muted">/mo</span>
                        </>
                      ) : (
                        <span className="text-muted">–</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={client.status} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted tabular-nums">
                      {formatDate(client.start_date)}
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
        {rows.length} of {clients.length} clients
      </p>
    </div>
  );
}
