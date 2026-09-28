import type { BadgeTone } from '@/components/Badge';
import type { SelectOption } from '@/components/Input';
import { toOptions } from '@/lib/labels';
import type { LeadOffer, LeadSource, LeadStage } from './types';

export { INDUSTRY_LABELS, INDUSTRY_OPTIONS } from '@/lib/labels';

export interface StageMeta {
  value: LeadStage;
  label: string;
  tone: BadgeTone;
  /** Dot colour in column headers. */
  dot: string;
}

export const STAGES: readonly StageMeta[] = [
  { value: 'new', label: 'New', tone: 'neutral', dot: 'bg-muted' },
  { value: 'contacted', label: 'Contacted', tone: 'blue', dot: 'bg-accent-blue' },
  { value: 'call_booked', label: 'Call booked', tone: 'purple', dot: 'bg-accent-purple' },
  { value: 'proposal_sent', label: 'Proposal sent', tone: 'warning', dot: 'bg-warning' },
  { value: 'won', label: 'Won', tone: 'teal', dot: 'bg-accent-teal' },
  { value: 'lost', label: 'Lost', tone: 'danger', dot: 'bg-danger' },
];

export const STAGE_ORDER: readonly LeadStage[] = STAGES.map((stage) => stage.value);

export const STAGE_META = Object.fromEntries(STAGES.map((stage) => [stage.value, stage])) as Record<LeadStage, StageMeta>;

/** Stages that still count towards the open pipeline. */
export const OPEN_STAGES: readonly LeadStage[] = ['new', 'contacted', 'call_booked', 'proposal_sent'];

export const OFFER_LABELS: Record<LeadOffer, string> = {
  whatsapp_automation: 'WhatsApp automation',
  website: 'Website',
  voice_agent: 'Voice agent',
  other: 'Other',
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  outreach: 'Outreach',
  referral: 'Referral',
  website_form: 'Website form',
  social: 'Social',
  other: 'Other',
};

export const STAGE_OPTIONS: SelectOption<LeadStage>[] = STAGES.map(({ value, label }) => ({ value, label }));
export const OFFER_OPTIONS = toOptions(OFFER_LABELS);
export const SOURCE_OPTIONS = toOptions(SOURCE_LABELS);
