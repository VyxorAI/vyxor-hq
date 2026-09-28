import { FormDrawer } from '@/components/FormDrawer';
import { useToast } from '@/components/Toast';
import { useClients } from '@/features/clients/api';
import { errorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { useFormState } from '@/lib/useFormState';
import { moneyInput } from '@/lib/validation';
import { useDeleteInvoice, useSaveInvoice } from './api';
import { InvoiceForm } from './form/InvoiceForm';
import {
  toInvoiceFormValues,
  toInvoicePayload,
  validateInvoice,
  type InvoiceFormValues,
} from './form/invoiceFormModel';
import type { Invoice } from './types';

const FORM_ID = 'invoice-form';

interface InvoiceDrawerProps {
  /** Undefined when adding a new invoice. */
  invoice: Invoice | undefined;
  defaultClientId?: string;
  onClose: () => void;
}

export function InvoiceDrawer({ invoice, defaultClientId, onClose }: InvoiceDrawerProps) {
  const toast = useToast();
  const { data: clients = [] } = useClients();
  const saveInvoice = useSaveInvoice();
  const deleteInvoice = useDeleteInvoice();

  const amountFor = (clientId: string, type: InvoiceFormValues['type']) => {
    const client = clients.find((item) => item.id === clientId);
    if (!client) return null;
    if (type === 'retainer') return client.monthly_retainer;
    if (type === 'setup') return client.setup_fee;
    return null;
  };

  const form = useFormState(
    () => toInvoiceFormValues(invoice, { clientId: defaultClientId, amount: defaultClientId ? amountFor(defaultClientId, 'retainer') : null }),
    validateInvoice,
  );

  // Picking a client or type fills in the agreed retainer / setup fee, unless an amount was typed
  function handleChange<K extends keyof InvoiceFormValues>(key: K, value: InvoiceFormValues[K]) {
    const patch = { [key]: value } as Partial<InvoiceFormValues>;
    if ((key === 'client_id' || key === 'type') && !invoice) {
      const next = { ...form.values, ...patch };
      const suggested = amountFor(next.client_id, next.type);
      const previous = amountFor(form.values.client_id, form.values.type);
      if (suggested && (!form.values.amount || form.values.amount === moneyInput(previous))) {
        patch.amount = moneyInput(suggested);
      }
    }
    form.changeMany(patch);
  }

  function save() {
    const values = form.check();
    if (!values) return;
    saveInvoice.mutate(
      { id: invoice?.id, payload: toInvoicePayload(values) },
      {
        onSuccess: (saved) => {
          toast.success(invoice ? 'Changes saved.' : `Invoice ${saved.number} added.`);
          onClose();
        },
        onError: (error) => toast.error(`Couldn't save the invoice. ${errorMessage(error)}`),
      },
    );
  }

  return (
    <FormDrawer
      title={invoice ? `Invoice ${invoice.number}` : 'New invoice'}
      subtitle={invoice && <p className="text-xs text-muted">Added {formatDate(invoice.created_at)}</p>}
      formId={FORM_ID}
      submitLabel={invoice ? 'Save changes' : 'Add invoice'}
      saving={saveInvoice.isPending}
      onClose={onClose}
      onDelete={
        invoice && {
          noun: 'invoice',
          description: `This permanently removes invoice ${invoice.number}. It can't be undone.`,
          pending: deleteInvoice.isPending,
          onConfirm: () =>
            deleteInvoice.mutate(invoice.id, {
              onSuccess: () => {
                toast.success('Invoice deleted.');
                onClose();
              },
              onError: (error) => toast.error(`Couldn't delete the invoice. ${errorMessage(error)}`),
            }),
        }
      }
    >
      <InvoiceForm id={FORM_ID} values={form.values} errors={form.errors} onChange={handleChange} onSubmit={save} />
    </FormDrawer>
  );
}
