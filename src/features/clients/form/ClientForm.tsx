import type { FormEvent } from 'react';
import { ExternalLink, KeyRound } from 'lucide-react';
import { Field } from '@/components/Field';
import { FormSection } from '@/components/FormSection';
import { Input, Select, Textarea } from '@/components/Input';
import { useProfiles } from '@/features/auth/profiles';
import { INDUSTRY_OPTIONS } from '@/lib/labels';
import { isHttpUrl } from '@/lib/validation';
import { PACKAGE_SUGGESTIONS, STATUS_OPTIONS } from '../constants';
import type { ClientFormErrors, ClientFormValues } from './clientFormModel';

interface ClientFormProps {
  id: string;
  values: ClientFormValues;
  errors: ClientFormErrors;
  onChange: <K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) => void;
  onSubmit: () => void;
  /** Focus the first field when shown (drawers). */
  autoFocus?: boolean;
}

type TextKey = Exclude<keyof ClientFormValues, 'industry' | 'status'>;

export function ClientForm({ id, values, errors, onChange, onSubmit, autoFocus = false }: ClientFormProps) {
  const { data: profiles = [] } = useProfiles();
  const ownerOptions = profiles.map((profile) => ({ value: profile.id, label: profile.full_name }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  // Text-like input bound to a form field, with its error wired up
  function text(
    key: TextKey,
    props: { type?: string; inputMode?: 'decimal' | 'tel'; placeholder?: string; list?: string } = {},
  ) {
    const error = errors[key];
    return (
      <Input
        id={`${id}-${key}`}
        value={values[key]}
        onChange={(event) => onChange(key, event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-${key}-error` : undefined}
        {...props}
      />
    );
  }

  const vaultLink = values.vault_link.trim();

  return (
    <form id={id} onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
      <FormSection title="Business">
        <Field label="Business name" htmlFor={`${id}-business_name`} error={errors.business_name} required>
          <Input
            id={`${id}-business_name`}
            value={values.business_name}
            onChange={(event) => onChange('business_name', event.target.value)}
            aria-invalid={errors.business_name ? true : undefined}
            aria-describedby={errors.business_name ? `${id}-business_name-error` : undefined}
            data-autofocus={autoFocus || undefined}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contact name" htmlFor={`${id}-contact_name`}>
            {text('contact_name')}
          </Field>
          <Field label="Phone" htmlFor={`${id}-phone`}>
            {text('phone', { type: 'tel', inputMode: 'tel', placeholder: '082 123 4567' })}
          </Field>
          <Field label="Email" htmlFor={`${id}-email`} error={errors.email}>
            {text('email', { type: 'email' })}
          </Field>
          <Field label="Website" htmlFor={`${id}-website`}>
            {text('website', { type: 'url', placeholder: 'example.co.za' })}
          </Field>
        </div>
      </FormSection>

      <FormSection title="Account">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Status" htmlFor={`${id}-status`}>
            <Select
              id={`${id}-status`}
              options={STATUS_OPTIONS}
              value={values.status}
              onChange={(event) => onChange('status', event.target.value as ClientFormValues['status'])}
            />
          </Field>
          <Field label="Owner" htmlFor={`${id}-owner_id`}>
            <Select
              id={`${id}-owner_id`}
              placeholder="No owner"
              options={ownerOptions}
              value={values.owner_id}
              onChange={(event) => onChange('owner_id', event.target.value)}
            />
          </Field>
          <Field label="Industry" htmlFor={`${id}-industry`}>
            <Select
              id={`${id}-industry`}
              options={INDUSTRY_OPTIONS}
              value={values.industry}
              onChange={(event) => onChange('industry', event.target.value as ClientFormValues['industry'])}
            />
          </Field>
          <Field label="Package" htmlFor={`${id}-package`}>
            {text('package', { list: `${id}-package-suggestions`, placeholder: 'e.g. WhatsApp automation' })}
            <datalist id={`${id}-package-suggestions`}>
              {PACKAGE_SUGGESTIONS.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </Field>
          <Field label="Monthly retainer (R)" htmlFor={`${id}-monthly_retainer`} error={errors.monthly_retainer}>
            {text('monthly_retainer', { inputMode: 'decimal', placeholder: '2500' })}
          </Field>
          <Field label="Setup fee (R)" htmlFor={`${id}-setup_fee`} error={errors.setup_fee}>
            {text('setup_fee', { inputMode: 'decimal', placeholder: '7500' })}
          </Field>
          <Field label="Start date" htmlFor={`${id}-start_date`}>
            {text('start_date', { type: 'date' })}
          </Field>
        </div>
      </FormSection>

      <FormSection title="Access">
        <Field
          label="Vault link"
          htmlFor={`${id}-vault_link`}
          error={errors.vault_link}
          hint="Link to this client's entry in the password manager. Never store passwords in Vyxor HQ."
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <Input
                id={`${id}-vault_link`}
                type="url"
                value={values.vault_link}
                onChange={(event) => onChange('vault_link', event.target.value)}
                placeholder="https://"
                className="pl-8"
                aria-invalid={errors.vault_link ? true : undefined}
                aria-describedby={errors.vault_link ? `${id}-vault_link-error` : undefined}
              />
            </div>
            {isHttpUrl(vaultLink) && (
              <a
                href={vaultLink}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control border border-border bg-raised px-3 text-sm font-medium hover:border-accent-blue/60"
              >
                <ExternalLink className="size-4" aria-hidden />
                Open
              </a>
            )}
          </div>
        </Field>
      </FormSection>

      <FormSection title="Notes">
        <Textarea
          id={`${id}-notes`}
          aria-label="Notes"
          rows={5}
          value={values.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          placeholder="Scope, preferences, anything the other founder should know"
        />
      </FormSection>
    </form>
  );
}
