import type { Enums, Tables } from '@/lib/database.types';

export type Prospect = Tables<'prospects'>;
export type ProspectSearch = Tables<'prospect_searches'>;
export type ProspectStatus = Enums<'prospect_status'>;

/** List tabs: "do not contact" is a flag, shown as its own tab. */
export type ProspectTab = 'new' | 'converted' | 'dismissed' | 'dnc';

/** How the first contact happened. Email and WhatsApp only to ask consent (POPIA). */
export type ContactChannel = 'call' | 'email' | 'whatsapp';
