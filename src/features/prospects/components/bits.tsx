import { Link } from 'react-router-dom';
import { Ban, Globe, Mail, MapPin, Phone, PhoneCall, RotateCcw, Star, X } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button, IconButton } from '@/components/Button';
import { OFFER_LABELS } from '@/features/leads/constants';
import { cn } from '@/lib/cn';
import { PITCH_TONE, priorityOf } from '../constants';
import type { Prospect, ProspectTab } from '../types';

export function PitchBadge({ prospect }: { prospect: Prospect }) {
  return <Badge tone={PITCH_TONE[prospect.suggested_offer]}>{OFFER_LABELS[prospect.suggested_offer]}</Badge>;
}

export function PriorityBadge({ score }: { score: number }) {
  const priority = priorityOf(score);
  return (
    <span title={`Priority score ${score} / 100`}>
      <Badge tone={priority.tone}>{priority.label}</Badge>
    </span>
  );
}

/** "★ 4.6 (123)" or a dash. */
export function Rating({ prospect }: { prospect: Prospect }) {
  if (prospect.rating === null) return <span className="text-xs text-muted">No reviews</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs tabular-nums" title={`${prospect.review_count ?? 0} Google reviews`}>
      <Star className="size-3.5 fill-warning text-warning" aria-hidden />
      <span className="font-medium text-primary">{Number(prospect.rating).toFixed(1)}</span>
      <span className="text-muted">({prospect.review_count ?? 0})</span>
    </span>
  );
}

/** Click-to-call phone, email, website and Google Maps. */
export function ContactLinks({ prospect, className }: { prospect: Prospect; className?: string }) {
  const tel = (prospect.phone_international ?? prospect.phone ?? '').replace(/[^\d+]/g, '');
  const site = prospect.website;
  return (
    <div className={cn('flex flex-col gap-1 text-xs', className)}>
      {prospect.phone ? (
        <a href={`tel:${tel}`} className="inline-flex w-fit items-center gap-1.5 font-medium text-primary hover:text-accent-blue">
          <Phone className="size-3.5 text-muted" aria-hidden />
          <span className="tabular-nums">{prospect.phone}</span>
        </a>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Phone className="size-3.5" aria-hidden />
          No phone listed
        </span>
      )}
      {prospect.email && (
        <a href={`mailto:${prospect.email}`} className="inline-flex w-fit max-w-full items-center gap-1.5 text-muted hover:text-primary">
          <Mail className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{prospect.email}</span>
        </a>
      )}
      <span className="flex items-center gap-3 text-muted">
        {site && (
          <a href={site} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-primary">
            <Globe className="size-3.5" aria-hidden />
            Website
          </a>
        )}
        {prospect.maps_url && (
          <a href={prospect.maps_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-primary">
            <MapPin className="size-3.5" aria-hidden />
            Maps
          </a>
        )}
      </span>
    </div>
  );
}

export interface ProspectActionHandlers {
  onContacted: (prospect: Prospect) => void;
  onDismiss: (prospect: Prospect) => void;
  onDoNotContact: (prospect: Prospect) => void;
  onRestore: (prospect: Prospect) => void;
  onClearDoNotContact: (prospect: Prospect) => void;
  /** Id of the prospect whose quick action is saving. */
  pendingId?: string;
}

/** The buttons for one prospect, depending on which tab it's in. */
export function ProspectActions({ prospect, tab, handlers }: { prospect: Prospect; tab: ProspectTab; handlers: ProspectActionHandlers }) {
  const pending = handlers.pendingId === prospect.id;

  if (tab === 'converted') {
    return prospect.lead_id ? (
      <Link to={`/leads?lead=${prospect.lead_id}`} className="text-xs font-medium text-accent-blue hover:underline">
        Open lead
      </Link>
    ) : (
      <span className="text-xs text-muted">Lead deleted</span>
    );
  }
  if (tab === 'dismissed') {
    return (
      <Button size="sm" icon={RotateCcw} loading={pending} onClick={() => handlers.onRestore(prospect)}>
        Restore
      </Button>
    );
  }
  if (tab === 'dnc') {
    return (
      <Button size="sm" variant="ghost" loading={pending} onClick={() => handlers.onClearDoNotContact(prospect)}>
        Remove flag
      </Button>
    );
  }
  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="sm" variant="primary" icon={PhoneCall} onClick={() => handlers.onContacted(prospect)}>
        Contacted
      </Button>
      <IconButton icon={X} label="Not a fit" size="sm" disabled={pending} onClick={() => handlers.onDismiss(prospect)} />
      <IconButton
        icon={Ban}
        label="Do not contact"
        size="sm"
        disabled={pending}
        onClick={() => handlers.onDoNotContact(prospect)}
        className="hover:text-danger"
      />
    </div>
  );
}
