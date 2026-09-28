import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Trash2, Trophy } from 'lucide-react';
import { Button, IconButton } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useCurrentProfile } from '@/features/auth/profiles';
import { useClientsByLead } from '@/features/clients/api';
import { ConvertLeadDrawer } from '@/features/clients/ConvertLeadDrawer';
import { clientValuesFromLead, type ClientFormValues } from '@/features/clients/form/clientFormModel';
import { errorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { useFormState } from '@/lib/useFormState';
import { useCreateLead, useDeleteLead, useUpdateLead } from '../api';
import { StageBadge } from '../components/StageBadge';
import { SOURCE_LABELS } from '../constants';
import type { Lead } from '../types';
import { LeadForm } from './LeadForm';
import { toFormValues, toPayload, validateLead } from './leadFormModel';

const FORM_ID = 'lead-form';

interface LeadDrawerProps {
  open: boolean;
  /** Undefined when adding a new lead. */
  lead: Lead | undefined;
  onClose: () => void;
}

export function LeadDrawer({ open, lead, onClose }: LeadDrawerProps) {
  if (!open) return null;
  // Keyed so the form resets when switching between leads
  return <LeadEditor key={lead?.id ?? 'new'} lead={lead} onClose={onClose} />;
}

function LeadEditor({ lead, onClose }: { lead: Lead | undefined; onClose: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const currentProfile = useCurrentProfile();
  const client = useClientsByLead().get(lead?.id ?? '');
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const initialValues = useRef(toFormValues(lead, currentProfile?.id));
  const form = useFormState(() => initialValues.current, validateLead);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Set while the "Convert to client" drawer is showing
  const [converting, setConverting] = useState<ClientFormValues | null>(null);
  const saving = createLead.isPending || updateLead.isPending;

  function save() {
    const values = form.check();
    if (!values) return;

    const payload = toPayload(values);
    if (lead) {
      updateLead.mutate(
        { id: lead.id, changes: payload },
        {
          onSuccess: () => {
            toast.success('Changes saved.');
            onClose();
          },
          onError: (error) => toast.error(`Couldn't save changes. ${errorMessage(error)}`),
        },
      );
    } else {
      createLead.mutate(payload, {
        onSuccess: () => {
          toast.success('Lead added.');
          onClose();
        },
        onError: (error) => toast.error(`Couldn't add the lead. ${errorMessage(error)}`),
      });
    }
  }

  /** "Mark as won": keep any unsaved lead edits, then open the pre-filled client form. */
  function startConversion() {
    if (!lead) return;
    const values = form.check();
    if (!values) return;

    const dirty = JSON.stringify(values) !== JSON.stringify(initialValues.current);
    if (!dirty) {
      setConverting(clientValuesFromLead(values));
      return;
    }
    // The stage changes when the client is created, not here
    updateLead.mutate(
      { id: lead.id, changes: { ...toPayload(values), stage: lead.stage } },
      {
        onSuccess: () => {
          initialValues.current = values;
          setConverting(clientValuesFromLead(values));
        },
        onError: (error) => toast.error(`Couldn't save changes. ${errorMessage(error)}`),
      },
    );
  }

  function handleDelete() {
    if (!lead) return;
    deleteLead.mutate(lead.id, {
      onSuccess: () => {
        toast.success('Lead deleted.');
        setConfirmDelete(false);
        onClose();
      },
      onError: (error) => toast.error(`Couldn't delete the lead. ${errorMessage(error)}`),
    });
  }

  if (lead && converting) {
    return (
      <ConvertLeadDrawer
        lead={lead}
        initialValues={converting}
        onCancel={() => setConverting(null)}
        onConverted={(clientId) => navigate(`/clients/${clientId}`)}
      />
    );
  }

  const subtitle = lead ? (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <StageBadge stage={lead.stage} />
      <span>Added {formatDate(lead.created_at)}</span>
      <span aria-hidden>·</span>
      <span>{SOURCE_LABELS[lead.source]}</span>
    </div>
  ) : (
    <p className="text-muted">Fill in what you know. You can add the rest later.</p>
  );

  let wonAction = null;
  if (lead && client) {
    wonAction = (
      <Button icon={ArrowUpRight} onClick={() => navigate(`/clients/${client.id}`)}>
        View client
      </Button>
    );
  } else if (lead) {
    wonAction = (
      <Button icon={Trophy} onClick={startConversion} disabled={saving}>
        {lead.stage === 'won' ? 'Convert to client' : 'Mark as won'}
      </Button>
    );
  }

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        title={lead ? lead.business_name : 'New lead'}
        subtitle={subtitle}
        footer={
          <>
            {lead && (
              <IconButton
                icon={Trash2}
                label="Delete lead"
                onClick={() => setConfirmDelete(true)}
                className="hover:bg-danger/15 hover:text-danger"
              />
            )}
            <div className="ml-auto flex flex-wrap justify-end gap-2">
              {wonAction}
              <Button type="submit" form={FORM_ID} variant="primary" loading={saving}>
                {lead ? 'Save changes' : 'Add lead'}
              </Button>
            </div>
          </>
        }
      >
        <LeadForm id={FORM_ID} values={form.values} errors={form.errors} onChange={form.change} onSubmit={save} />
      </Drawer>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this lead?"
        description={
          client
            ? `This permanently removes the lead for ${lead?.business_name}. The client record stays. It can't be undone.`
            : `This permanently removes ${lead?.business_name ?? 'the lead'}. It can't be undone.`
        }
        footer={
          <>
            <Button onClick={() => setConfirmDelete(false)}>Keep lead</Button>
            <Button variant="danger" icon={Trash2} loading={deleteLead.isPending} onClick={handleDelete}>
              Delete lead
            </Button>
          </>
        }
      />
    </>
  );
}
