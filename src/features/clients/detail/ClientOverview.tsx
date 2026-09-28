import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useInvoices } from '@/features/money/api';
import { errorMessage } from '@/lib/errors';
import { useFormState } from '@/lib/useFormState';
import { useDeleteClient, useUpdateClient } from '../api';
import { ClientForm } from '../form/ClientForm';
import { toClientFormValues, toClientPayload, validateClient } from '../form/clientFormModel';
import type { Client } from '../types';

const FORM_ID = 'client-overview-form';

/** Overview tab: every client field, editable in place. */
export function ClientOverview({ client }: { client: Client }) {
  const navigate = useNavigate();
  const toast = useToast();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const form = useFormState(() => toClientFormValues(client, undefined), validateClient);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: invoices = [] } = useInvoices();
  const hasInvoices = invoices.some((invoice) => invoice.client_id === client.id);

  function handleSave() {
    const values = form.check();
    if (!values) return;
    updateClient.mutate(
      { id: client.id, changes: toClientPayload(values) },
      {
        onSuccess: () => toast.success('Changes saved.'),
        onError: (error) => toast.error(`Couldn't save changes. ${errorMessage(error)}`),
      },
    );
  }

  function handleDelete() {
    deleteClient.mutate(client.id, {
      onSuccess: () => {
        toast.success('Client deleted.');
        navigate('/clients', { replace: true });
      },
      onError: (error) =>
        toast.error(
          // 23503: still referenced by invoices (added since this page loaded)
          (error as { code?: string }).code === '23503'
            ? "This client has invoices, so it can't be deleted. Set the status to Churned instead."
            : `Couldn't delete the client. ${errorMessage(error)}`,
        ),
    });
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="rounded-card border border-border bg-surface p-5">
        <ClientForm id={FORM_ID} values={form.values} errors={form.errors} onChange={form.change} onSubmit={handleSave} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(true)} className="hover:text-danger">
          Delete client
        </Button>
        <Button type="submit" form={FORM_ID} variant="primary" loading={updateClient.isPending}>
          Save changes
        </Button>
      </div>

      {hasInvoices ? (
        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title="This client can't be deleted"
          description={`${client.business_name} has invoices, and financial history is kept. Set the status to Churned instead.`}
          footer={<Button onClick={() => setConfirmDelete(false)}>OK</Button>}
        />
      ) : (
        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title="Delete this client?"
          description={`This permanently removes ${client.business_name}, with all of its projects and tasks. The original lead stays in the pipeline. It can't be undone.`}
          footer={
            <>
              <Button onClick={() => setConfirmDelete(false)}>Keep client</Button>
              <Button variant="danger" icon={Trash2} loading={deleteClient.isPending} onClick={handleDelete}>
                Delete client
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}
