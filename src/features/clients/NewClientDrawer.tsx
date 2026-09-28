import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/Toast';
import { useCurrentProfile } from '@/features/auth/profiles';
import { errorMessage } from '@/lib/errors';
import { useCreateClient } from './api';
import { ClientFormDrawer } from './form/ClientFormDrawer';
import { toClientFormValues } from './form/clientFormModel';

/** Add a client directly, without a lead. Opens the client's page when saved. */
export function NewClientDrawer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const currentProfile = useCurrentProfile();
  const createClient = useCreateClient();

  return (
    <ClientFormDrawer
      title="New client"
      subtitle={<p className="text-muted">For clients that didn't come through the pipeline.</p>}
      initialValues={toClientFormValues(undefined, currentProfile?.id)}
      submitLabel="Add client"
      saving={createClient.isPending}
      onClose={onClose}
      onSubmit={(payload) =>
        createClient.mutate(payload, {
          onSuccess: (client) => {
            toast.success('Client added.');
            navigate(`/clients/${client.id}`);
          },
          onError: (error) => toast.error(`Couldn't add the client. ${errorMessage(error)}`),
        })
      }
    />
  );
}
