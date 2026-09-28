import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
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
      onError: (error) => toast.error(`Couldn't delete the client. ${errorMessage(error)}`),
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
    </div>
  );
}
