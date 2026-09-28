import { AlertCircle, Plus, Target } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { formatZAR } from '@/lib/format';
import { useUpdateParams } from '@/lib/useUpdateParams';
import { useLeads } from './api';
import { LeadsBoard } from './board/LeadsBoard';
import { OPEN_STAGES } from './constants';
import { LeadDrawer } from './drawer/LeadDrawer';
import { LeadsTable } from './table/LeadsTable';
import type { Lead } from './types';
import { ViewToggle, type LeadsView } from './ViewToggle';

function pipelineValue(leads: Lead[]): number {
  return leads
    .filter((lead) => OPEN_STAGES.includes(lead.stage))
    .reduce((sum, lead) => sum + (lead.estimated_monthly ?? 0), 0);
}

/**
 * Leads pipeline. URL state: `view=table`, `lead=<id>` (drawer open on a lead),
 * `new=1` (drawer open on a new lead), plus the table filters.
 */
export function LeadsPage() {
  const [params, updateParams] = useUpdateParams();
  const { data: leads, isPending, error, refetch } = useLeads();

  const view: LeadsView = params.get('view') === 'table' ? 'table' : 'board';
  const selectedId = params.get('lead');
  const creating = params.get('new') === '1';
  const selectedLead = selectedId ? leads?.find((lead) => lead.id === selectedId) : undefined;

  const setView = (next: LeadsView) =>
    updateParams((p) => (next === 'table' ? p.set('view', 'table') : p.delete('view')), true);
  const openLead = (id: string) =>
    updateParams((p) => {
      p.delete('new');
      p.set('lead', id);
    });
  const openNew = () =>
    updateParams((p) => {
      p.delete('lead');
      p.set('new', '1');
    });
  const closeDrawer = () =>
    updateParams((p) => {
      p.delete('lead');
      p.delete('new');
    }, true);

  let content;
  if (isPending) {
    content = (
      <div className="flex justify-center py-20">
        <Spinner label="Loading leads" />
      </div>
    );
  } else if (!leads) {
    // Only when nothing is cached; a failed background refresh keeps showing the last data
    content = (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load leads"
        description={error?.message}
        action={<Button onClick={() => void refetch()}>Try again</Button>}
      />
    );
  } else if (leads.length === 0) {
    content = (
      <EmptyState
        icon={Target}
        title="No leads yet"
        description="Add your first one or connect the website form."
        action={
          <Button variant="primary" icon={Plus} onClick={openNew}>
            Add lead
          </Button>
        }
      />
    );
  } else if (view === 'board') {
    content = <LeadsBoard leads={leads} onOpenLead={openLead} />;
  } else {
    content = <LeadsTable leads={leads} onOpenLead={openLead} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewToggle value={view} onChange={setView} />
        {leads && leads.length > 0 && (
          <p className="text-sm text-muted">
            Open pipeline{' '}
            <span className="font-display text-md font-semibold text-primary tabular-nums">
              {formatZAR(pipelineValue(leads))}
            </span>
            /mo
          </p>
        )}
      </div>

      {content}

      <LeadDrawer
        open={creating || (selectedId !== null && selectedLead !== undefined)}
        lead={creating ? undefined : selectedLead}
        onClose={closeDrawer}
      />
    </div>
  );
}
