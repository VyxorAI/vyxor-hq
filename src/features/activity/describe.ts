import { ArrowRightLeft, Mail, MessageSquare, Phone, type LucideIcon } from 'lucide-react';
import { STATUS_META as CLIENT_STATUS_META } from '@/features/clients/constants';
import { STAGE_META } from '@/features/leads/constants';
import { PROJECT_STATUS_META } from '@/features/projects/constants';
import type { Activity, ChangeMeta, ManualKind } from './types';

export const MANUAL_KINDS: ReadonlyArray<{ value: ManualKind; label: string; action: string; icon: LucideIcon }> = [
  { value: 'note', label: 'Note', action: 'Add note', icon: MessageSquare },
  { value: 'call', label: 'Call', action: 'Log call', icon: Phone },
  { value: 'email', label: 'Email', action: 'Log email', icon: Mail },
];

export function kindIcon(activity: Activity): LucideIcon {
  return MANUAL_KINDS.find((kind) => kind.value === activity.kind)?.icon ?? ArrowRightLeft;
}

/** Stored enum value -> label, per record type. */
function changeLabel(activity: Activity, value: string | null): string {
  if (!value) return 'nothing';
  if (activity.entity_type === 'lead') return STAGE_META[value as keyof typeof STAGE_META]?.label ?? value;
  if (activity.entity_type === 'client') return CLIENT_STATUS_META[value as keyof typeof CLIENT_STATUS_META]?.label ?? value;
  return PROJECT_STATUS_META[value as keyof typeof PROJECT_STATUS_META]?.label ?? value;
}

function readMeta(activity: Activity): ChangeMeta | null {
  const meta = activity.meta;
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
  return {
    field: String(meta.field ?? ''),
    from: typeof meta.from === 'string' ? meta.from : null,
    to: typeof meta.to === 'string' ? meta.to : null,
  };
}

/** For stage/status changes: { from, to } as labels. */
export function describeChange(activity: Activity): { from: string; to: string } | null {
  const meta = readMeta(activity);
  if (!meta) return null;
  return { from: changeLabel(activity, meta.from), to: changeLabel(activity, meta.to) };
}

/** Verb phrase that reads before a record name: "added a note to", "logged a call with", "moved". */
export function activityVerb(activity: Activity): string {
  switch (activity.kind) {
    case 'note':
      return 'added a note to';
    case 'call':
      return 'logged a call with';
    case 'email':
      return 'logged an email with';
    case 'stage_change':
      return 'moved';
    case 'status_change':
      return 'changed the status of';
  }
}
