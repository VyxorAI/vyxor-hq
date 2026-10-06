import type { BadgeTone } from '@/components/Badge';
import type { LeadOffer } from '@/features/leads/types';
import type { ContactChannel, ProspectTab } from './types';

export const PITCH_TONE: Record<LeadOffer, BadgeTone> = {
  website: 'blue',
  whatsapp_automation: 'teal',
  voice_agent: 'purple',
  other: 'neutral',
};

export const TABS: ReadonlyArray<{ value: ProspectTab; label: string }> = [
  { value: 'new', label: 'To contact' },
  { value: 'converted', label: 'Moved to leads' },
  { value: 'dismissed', label: 'Not a fit' },
  { value: 'dnc', label: 'Do not contact' },
];

export const CHANNELS: ReadonlyArray<{ value: ContactChannel; label: string; hint: string }> = [
  { value: 'call', label: 'Phone call', hint: 'Recommended for a first contact.' },
  { value: 'email', label: 'Email asking permission', hint: 'POPIA: only to ask if you may send information, and only once.' },
  { value: 'whatsapp', label: 'WhatsApp asking permission', hint: 'POPIA: only to ask if you may send information, and only once.' },
];

/** Priority bands for the 0-100 score. */
export function priorityOf(score: number): { label: string; tone: BadgeTone } {
  if (score >= 75) return { label: 'High', tone: 'teal' };
  if (score >= 55) return { label: 'Medium', tone: 'blue' };
  return { label: 'Low', tone: 'neutral' };
}

/** Matches the daily cap in the find-prospects Edge Function. */
export const SEARCHES_PER_DAY = 15;
