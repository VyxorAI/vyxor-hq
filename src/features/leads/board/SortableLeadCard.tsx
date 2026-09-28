import { useSortableCard } from '@/components/kanban/useSortableCard';
import type { Profile } from '@/features/auth/profiles';
import { cn } from '@/lib/cn';
import type { Lead } from '../types';
import { LeadCard } from './LeadCard';

interface SortableLeadCardProps {
  lead: Lead;
  owner: Profile | undefined;
  onOpen: (id: string) => void;
}

export function SortableLeadCard({ lead, owner, onOpen }: SortableLeadCardProps) {
  const { isDragging, props } = useSortableCard(lead.id, lead.business_name, onOpen);

  return (
    <LeadCard
      lead={lead}
      owner={owner}
      className={cn('cursor-grab select-none active:cursor-grabbing', isDragging && 'opacity-40')}
      {...props}
    />
  );
}
