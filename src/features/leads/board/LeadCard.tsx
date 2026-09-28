import type { ComponentProps } from 'react';
import { Badge } from '@/components/Badge';
import type { Profile } from '@/features/auth/profiles';
import { cn } from '@/lib/cn';
import { formatZAR } from '@/lib/format';
import { FollowUpDate } from '../components/FollowUpDate';
import { OwnerAvatar } from '@/components/OwnerAvatar';
import { INDUSTRY_LABELS, OFFER_LABELS } from '../constants';
import type { Lead } from '../types';

interface LeadCardProps extends ComponentProps<'div'> {
  lead: Lead;
  owner: Profile | undefined;
  /** Lifted look while held in the drag overlay. */
  lifted?: boolean;
}

export function LeadCard({ lead, owner, lifted = false, className, ...props }: LeadCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 rounded-card border border-border bg-surface p-3 text-left transition-colors',
        'hover:border-accent-blue/50 hover:bg-raised/40',
        lifted && 'rotate-1 border-accent-blue/60 bg-raised shadow-overlay',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 font-medium leading-snug break-words">{lead.business_name}</p>
        <OwnerAvatar owner={owner} />
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge>{INDUSTRY_LABELS[lead.industry]}</Badge>
        <Badge tone="purple">{OFFER_LABELS[lead.offer]}</Badge>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium tabular-nums">
          {lead.estimated_monthly ? (
            <>
              {formatZAR(lead.estimated_monthly)}
              <span className="text-xs font-normal text-muted">/mo</span>
            </>
          ) : (
            <span className="text-xs font-normal text-muted">No estimate</span>
          )}
        </span>
        <FollowUpDate date={lead.next_follow_up} stage={lead.stage} />
      </div>
    </div>
  );
}
