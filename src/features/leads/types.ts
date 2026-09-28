import type { Enums, Tables, TablesInsert } from '@/lib/database.types';

export type Lead = Tables<'leads'>;
export type LeadInsert = TablesInsert<'leads'>;
export type LeadStage = Enums<'lead_stage'>;
export type LeadIndustry = Enums<'lead_industry'>;
export type LeadOffer = Enums<'lead_offer'>;
export type LeadSource = Enums<'lead_source'>;

/** A drag on the board: put lead `id` into `stage` at `index` (0 = top). */
export interface LeadMove {
  id: string;
  stage: LeadStage;
  index: number;
  /** Only when moving into "lost". */
  lostReason?: string;
}
