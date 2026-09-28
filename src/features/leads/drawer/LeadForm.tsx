import type { FormEvent } from 'react';
import { Field } from '@/components/Field';
import { FormSection as Section } from '@/components/FormSection';
import { Input, Select, Textarea } from '@/components/Input';
import { useProfiles } from '@/features/auth/profiles';
import { INDUSTRY_OPTIONS, OFFER_OPTIONS, SOURCE_OPTIONS, STAGE_OPTIONS } from '../constants';
import type { LeadFormErrors, LeadFormValues } from './leadFormModel';

interface LeadFormProps {
  id: string;
  values: LeadFormValues;
  errors: LeadFormErrors;
  onChange: <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) => void;
  onSubmit: () => void;
}

export function LeadForm({ id, values, errors, onChange, onSubmit }: LeadFormProps) {
  const { data: profiles = [] } = useProfiles();
  const ownerOptions = profiles.map((profile) => ({ value: profile.id, label: profile.full_name }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  // Text-like input bound to a form field, with its error wired up
  function text(key: keyof LeadFormValues, props: { type?: string; inputMode?: 'decimal' | 'tel'; placeholder?: string } = {}) {
    const error = errors[key];
    return (
      <Input
        id={`lead-${key}`}
        value={values[key]}
        onChange={(event) => onChange(key, event.target.value as never)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `lead-${key}-error` : undefined}
        {...props}
      />
    );
  }

  return (
    <form id={id} onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
      <Section title="Business">
        <Field label="Business name" htmlFor="lead-business_name" error={errors.business_name} required>
          <Input
            id="lead-business_name"
            value={values.business_name}
            onChange={(event) => onChange('business_name', event.target.value)}
            aria-invalid={errors.business_name ? true : undefined}
            aria-describedby={errors.business_name ? 'lead-business_name-error' : undefined}
            data-autofocus
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contact name" htmlFor="lead-contact_name">
            {text('contact_name')}
          </Field>
          <Field label="Phone" htmlFor="lead-phone">
            {text('phone', { type: 'tel', inputMode: 'tel', placeholder: '082 123 4567' })}
          </Field>
          <Field label="Email" htmlFor="lead-email" error={errors.email}>
            {text('email', { type: 'email' })}
          </Field>
          <Field label="Website" htmlFor="lead-website">
            {text('website', { type: 'url', placeholder: 'example.co.za' })}
          </Field>
        </div>
      </Section>

      <Section title="Deal">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Stage" htmlFor="lead-stage">
            <Select
              id="lead-stage"
              options={STAGE_OPTIONS}
              value={values.stage}
              onChange={(event) => onChange('stage', event.target.value as LeadFormValues['stage'])}
            />
          </Field>
          <Field label="Owner" htmlFor="lead-owner_id">
            <Select
              id="lead-owner_id"
              placeholder="No owner"
              options={ownerOptions}
              value={values.owner_id}
              onChange={(event) => onChange('owner_id', event.target.value)}
            />
          </Field>
          <Field label="Industry" htmlFor="lead-industry">
            <Select
              id="lead-industry"
              options={INDUSTRY_OPTIONS}
              value={values.industry}
              onChange={(event) => onChange('industry', event.target.value as LeadFormValues['industry'])}
            />
          </Field>
          <Field label="Offer" htmlFor="lead-offer">
            <Select
              id="lead-offer"
              options={OFFER_OPTIONS}
              value={values.offer}
              onChange={(event) => onChange('offer', event.target.value as LeadFormValues['offer'])}
            />
          </Field>
          <Field label="Estimated monthly (R)" htmlFor="lead-estimated_monthly" error={errors.estimated_monthly}>
            {text('estimated_monthly', { inputMode: 'decimal', placeholder: '2500' })}
          </Field>
          <Field label="Estimated setup fee (R)" htmlFor="lead-estimated_setup_fee" error={errors.estimated_setup_fee}>
            {text('estimated_setup_fee', { inputMode: 'decimal', placeholder: '7500' })}
          </Field>
          <Field label="Source" htmlFor="lead-source">
            <Select
              id="lead-source"
              options={SOURCE_OPTIONS}
              value={values.source}
              onChange={(event) => onChange('source', event.target.value as LeadFormValues['source'])}
            />
          </Field>
          <Field label="Next follow-up" htmlFor="lead-next_follow_up">
            {text('next_follow_up', { type: 'date' })}
          </Field>
        </div>
        {values.stage === 'lost' && (
          <Field label="Lost reason" htmlFor="lead-lost_reason" error={errors.lost_reason} required>
            <Textarea
              id="lead-lost_reason"
              rows={2}
              value={values.lost_reason}
              onChange={(event) => onChange('lost_reason', event.target.value)}
              aria-invalid={errors.lost_reason ? true : undefined}
              aria-describedby={errors.lost_reason ? 'lead-lost_reason-error' : undefined}
            />
          </Field>
        )}
      </Section>

      <Section title="Notes">
        <Textarea
          id="lead-notes"
          aria-label="Notes"
          rows={5}
          value={values.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          placeholder="Context, pain points, what was said on the call"
        />
      </Section>
    </form>
  );
}
