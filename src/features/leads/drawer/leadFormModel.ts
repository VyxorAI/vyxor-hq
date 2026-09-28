import { isEmail, moneyInput, orNull, parseMoney } from '@/lib/validation';
import type { Lead, LeadIndustry, LeadInsert, LeadOffer, LeadSource, LeadStage } from '../types';

/** Form state: everything as the inputs hold it (strings), enums typed. */
export interface LeadFormValues {
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  website: string;
  industry: LeadIndustry;
  offer: LeadOffer;
  stage: LeadStage;
  source: LeadSource;
  owner_id: string;
  estimated_setup_fee: string;
  estimated_monthly: string;
  next_follow_up: string;
  notes: string;
  lost_reason: string;
}

export type LeadFormErrors = Partial<Record<keyof LeadFormValues, string>>;

export function toFormValues(lead: Lead | undefined, defaultOwnerId: string | undefined): LeadFormValues {
  return {
    business_name: lead?.business_name ?? '',
    contact_name: lead?.contact_name ?? '',
    phone: lead?.phone ?? '',
    email: lead?.email ?? '',
    website: lead?.website ?? '',
    industry: lead?.industry ?? 'other',
    offer: lead?.offer ?? 'whatsapp_automation',
    stage: lead?.stage ?? 'new',
    source: lead?.source ?? 'outreach',
    owner_id: lead ? (lead.owner_id ?? '') : (defaultOwnerId ?? ''),
    estimated_setup_fee: moneyInput(lead?.estimated_setup_fee ?? null),
    estimated_monthly: moneyInput(lead?.estimated_monthly ?? null),
    next_follow_up: lead?.next_follow_up ?? '',
    notes: lead?.notes ?? '',
    lost_reason: lead?.lost_reason ?? '',
  };
}

export function validateLead(values: LeadFormValues): LeadFormErrors {
  const errors: LeadFormErrors = {};
  if (!values.business_name.trim()) errors.business_name = 'Add the business name.';
  if (values.email.trim() && !isEmail(values.email.trim())) errors.email = 'That email address looks wrong.';
  if (Number.isNaN(parseMoney(values.estimated_setup_fee))) errors.estimated_setup_fee = 'Use a number, e.g. 7500.';
  if (Number.isNaN(parseMoney(values.estimated_monthly))) errors.estimated_monthly = 'Use a number, e.g. 2500.';
  if (values.stage === 'lost' && !values.lost_reason.trim()) errors.lost_reason = 'Add a short reason.';
  return errors;
}

export function toPayload(values: LeadFormValues): Omit<LeadInsert, 'position'> {
  return {
    business_name: values.business_name.trim(),
    contact_name: orNull(values.contact_name),
    phone: orNull(values.phone),
    email: orNull(values.email),
    website: orNull(values.website),
    industry: values.industry,
    offer: values.offer,
    stage: values.stage,
    source: values.source,
    owner_id: values.owner_id || null,
    estimated_setup_fee: parseMoney(values.estimated_setup_fee),
    estimated_monthly: parseMoney(values.estimated_monthly),
    next_follow_up: values.next_follow_up || null,
    notes: orNull(values.notes),
    lost_reason: orNull(values.lost_reason),
  };
}
