import { useToast } from '@/components/Toast';
import type { Lead } from '@/features/leads/types';
import { errorMessage } from '@/lib/errors';
import { useConvertLead } from './api';
import { ClientFormDrawer } from './form/ClientFormDrawer';
import type { ClientFormValues } from './form/clientFormModel';

interface ConvertLeadDrawerProps {
  lead: Lead;
  /** Pre-filled from the lead. */
  initialValues: ClientFormValues;
  /** Position in the Won column when converting from a board drop. */
  index?: number;
  onCancel: () => void;
  onConverted: (clientId: string) => void;
}

/** "Mark as won": confirm the pre-filled client details, then create the client. */
export function ConvertLeadDrawer({ lead, initialValues, index, onCancel, onConverted }: ConvertLeadDrawerProps) {
  const toast = useToast();
  const convertLead = useConvertLead();

  return (
    <ClientFormDrawer
      title="Convert to client"
      subtitle={
        <p className="text-muted">
          Pre-filled from {lead.business_name}. Check the details, then create the client. The lead moves to Won.
        </p>
      }
      initialValues={initialValues}
      submitLabel="Create client"
      saving={convertLead.isPending}
      onClose={onCancel}
      onSubmit={(client) =>
        convertLead.mutate(
          { leadId: lead.id, client, index },
          {
            onSuccess: (clientId) => {
              toast.success(`${client.business_name} is now a client.`);
              onConverted(clientId);
            },
            onError: (error) => toast.error(`Couldn't create the client. ${errorMessage(error)}`),
          },
        )
      }
    />
  );
}
