import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import type { Profile } from '@/features/auth/profiles';
import { formatZAR } from '@/lib/format';
import type { StageMeta } from '../constants';
import type { Lead } from '../types';
import { SortableLeadCard } from './SortableLeadCard';

interface BoardColumnProps {
  stage: StageMeta;
  leads: Lead[];
  profiles: Map<string, Profile>;
  onOpenLead: (id: string) => void;
}

export function BoardColumn({ stage, leads, profiles, onOpenLead }: BoardColumnProps) {
  const monthlyTotal = leads.reduce((sum, lead) => sum + (lead.estimated_monthly ?? 0), 0);

  return (
    <KanbanColumn
      id={stage.value}
      label={stage.label}
      dot={stage.dot}
      itemIds={leads.map((lead) => lead.id)}
      emptyText="Drop a lead here"
      meta={
        <span className="text-xs font-medium tabular-nums text-muted" title="Total estimated monthly value">
          {formatZAR(monthlyTotal)}/mo
        </span>
      }
    >
      {leads.map((lead) => (
        <SortableLeadCard
          key={lead.id}
          lead={lead}
          owner={lead.owner_id ? profiles.get(lead.owner_id) : undefined}
          onOpen={onOpenLead}
        />
      ))}
    </KanbanColumn>
  );
}
