import type { LeadFormValues } from '@/features/leads/drawer/leadFormModel';
import { OFFER_LABELS } from '@/features/leads/constants';
import { todayISO } from '@/lib/format';
import type { Industry } from '@/lib/labels';
import { isEmail, isHttpUrl, moneyInput, orNull, parseMoney } from '@/lib/validation';
import type { Client, ClientPayload, ClientStatus } from '../types';

/** Form state: everything as the inputs hold it (strings), enums typed. */
export interface ClientFormValues {
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  website: string;
  industry: Industry;
  package: string;
  setup_fee: string;
  monthly_retainer: string;
  status: ClientStatus;
  start_date: string;
  owner_id: string;
  notes: string;
  vault_link: string;
}

export type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>;

export function toClientFormValues(client: Client | undefined, defaultOwnerId: string | undefined): ClientFormValues {
  return {
    business_name: client?.business_name ?? '',
    contact_name: client?.contact_name ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    website: client?.website ?? '',
    industry: client?.industry ?? 'other',
    package: client?.package ?? '',
    setup_fee: moneyInput(client?.setup_fee),
    monthly_retainer: moneyInput(client?.monthly_retainer),
    status: client?.status ?? 'onboarding',
    start_date: client ? (client.start_date ?? '') : todayISO(),
    owner_id: client ? (client.owner_id ?? '') : (defaultOwnerId ?? ''),
    notes: client?.notes ?? '',
    vault_link: client?.vault_link ?? '',
  };
}

/** Pre-fill a new client from a lead's form values ("Mark as won"). */
export function clientValuesFromLead(lead: LeadFormValues): ClientFormValues {
  return {
    business_name: lead.business_name,
    contact_name: lead.contact_name,
    phone: lead.phone,
    email: lead.email,
    website: lead.website,
    industry: lead.industry,
    package: lead.offer === 'other' ? '' : OFFER_LABELS[lead.offer],
    setup_fee: lead.estimated_setup_fee,
    monthly_retainer: lead.estimated_monthly,
    status: 'onboarding',
    start_date: todayISO(),
    owner_id: lead.owner_id,
    notes: lead.notes,
    vault_link: '',
  };
}

export function validateClient(values: ClientFormValues): ClientFormErrors {
  const errors: ClientFormErrors = {};
  if (!values.business_name.trim()) errors.business_name = 'Add the business name.';
  if (values.email.trim() && !isEmail(values.email.trim())) errors.email = 'That email address looks wrong.';
  if (Number.isNaN(parseMoney(values.setup_fee))) errors.setup_fee = 'Use a number, e.g. 7500.';
  if (Number.isNaN(parseMoney(values.monthly_retainer))) errors.monthly_retainer = 'Use a number, e.g. 2500.';
  if (values.vault_link.trim() && !isHttpUrl(values.vault_link.trim())) {
    errors.vault_link = 'Paste the full link, starting with https://';
  }
  return errors;
}

export function toClientPayload(values: ClientFormValues): ClientPayload {
  return {
    business_name: values.business_name.trim(),
    contact_name: orNull(values.contact_name),
    phone: orNull(values.phone),
    email: orNull(values.email),
    website: orNull(values.website),
    industry: values.industry,
    package: orNull(values.package),
    setup_fee: parseMoney(values.setup_fee),
    monthly_retainer: parseMoney(values.monthly_retainer),
    status: values.status,
    start_date: values.start_date || null,
    owner_id: values.owner_id || null,
    notes: orNull(values.notes),
    vault_link: orNull(values.vault_link),
  };
}
