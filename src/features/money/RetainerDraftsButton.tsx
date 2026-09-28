import { useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useClients } from '@/features/clients/api';
import { errorMessage } from '@/lib/errors';
import { addDaysISO, formatZAR, todayISO } from '@/lib/format';
import { useCreateInvoices, useInvoices } from './api';
import { DEFAULT_TERMS_DAYS } from './form/invoiceFormModel';
import { clientsNeedingRetainerInvoice, currentMonth, formatMonth } from './money';

/** Creates a draft retainer invoice for each active client not yet invoiced this month. */
export function RetainerDraftsButton() {
  const toast = useToast();
  const { data: clients = [] } = useClients();
  const { data: invoices = [] } = useInvoices();
  const createInvoices = useCreateInvoices();
  const [open, setOpen] = useState(false);

  const due = clientsNeedingRetainerInvoice(clients, invoices);
  const total = due.reduce((sum, client) => sum + (client.monthly_retainer ?? 0), 0);
  const month = formatMonth(currentMonth(), 'long');

  function create() {
    const today = todayISO();
    createInvoices.mutate(
      due.map((client) => ({
        client_id: client.id,
        type: 'retainer' as const,
        amount: client.monthly_retainer ?? 0,
        issued_on: today,
        due_on: addDaysISO(today, DEFAULT_TERMS_DAYS),
        status: 'draft' as const,
      })),
      {
        onSuccess: () => {
          toast.success(`${due.length} draft ${due.length === 1 ? 'invoice' : 'invoices'} created. Check them, then mark as sent.`);
          setOpen(false);
        },
        onError: (error) => toast.error(`Couldn't create the drafts. ${errorMessage(error)}`),
      },
    );
  }

  return (
    <>
      <Button icon={FilePlus2} onClick={() => setOpen(true)} disabled={due.length === 0} title={due.length === 0 ? `Every active retainer is invoiced for ${month}.` : undefined}>
        {due.length === 0 ? 'Retainers invoiced' : `Draft ${due.length} retainer ${due.length === 1 ? 'invoice' : 'invoices'}`}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Draft retainer invoices for ${month}?`}
        description={`One draft per active client that hasn't had a retainer invoice this month, due in ${DEFAULT_TERMS_DAYS} days.`}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={createInvoices.isPending} onClick={create}>
              Create {due.length} {due.length === 1 ? 'draft' : 'drafts'}
            </Button>
          </>
        }
      >
        <ul className="flex max-h-60 flex-col overflow-y-auto rounded-control border border-border">
          {due.map((client) => (
            <li key={client.id} className="flex justify-between gap-4 border-b border-border px-3 py-2 last:border-b-0">
              <span className="truncate">{client.business_name}</span>
              <span className="tabular-nums">{formatZAR(client.monthly_retainer)}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between px-3 font-medium tabular-nums">
          <span>Total</span>
          <span>{formatZAR(total)}</span>
        </p>
      </Modal>
    </>
  );
}
