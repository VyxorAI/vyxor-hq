import type { ReactNode } from 'react';
import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { useFormState } from '@/lib/useFormState';
import type { ClientPayload } from '../types';
import { ClientForm } from './ClientForm';
import { toClientPayload, validateClient, type ClientFormValues } from './clientFormModel';

const FORM_ID = 'client-drawer-form';

interface ClientFormDrawerProps {
  title: string;
  subtitle?: ReactNode;
  initialValues: ClientFormValues;
  submitLabel: string;
  saving: boolean;
  onSubmit: (payload: ClientPayload) => void;
  onClose: () => void;
}

/** Drawer with the full client form. Used to add a client and to convert a lead. */
export function ClientFormDrawer({
  title,
  subtitle,
  initialValues,
  submitLabel,
  saving,
  onSubmit,
  onClose,
}: ClientFormDrawerProps) {
  const form = useFormState(() => initialValues, validateClient);

  function handleSubmit() {
    const values = form.check();
    if (values) onSubmit(toClientPayload(values));
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={
        <div className="ml-auto flex gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form={FORM_ID} variant="primary" loading={saving}>
            {submitLabel}
          </Button>
        </div>
      }
    >
      <ClientForm
        id={FORM_ID}
        values={form.values}
        errors={form.errors}
        onChange={form.change}
        onSubmit={handleSubmit}
        autoFocus
      />
    </Drawer>
  );
}
