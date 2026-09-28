import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus, Users } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { formatZAR } from '@/lib/format';
import { useUpdateParams } from '@/lib/useUpdateParams';
import { useClients } from './api';
import { NewClientDrawer } from './NewClientDrawer';
import { ClientsTable } from './table/ClientsTable';
import { monthlyRecurring } from './table/filters';

/** Clients list. URL state: `new=1` opens the new client drawer, plus the table filters. */
export function ClientsPage() {
  const navigate = useNavigate();
  const [params, updateParams] = useUpdateParams();
  const { data: clients, isPending, error, refetch } = useClients();

  const creating = params.get('new') === '1';
  const openNew = () => updateParams((p) => p.set('new', '1'));
  const closeNew = () => updateParams((p) => p.delete('new'), true);
  const openClient = (id: string) => navigate(`/clients/${id}`);

  let content;
  if (isPending) {
    content = (
      <div className="flex justify-center py-20">
        <Spinner label="Loading clients" />
      </div>
    );
  } else if (!clients) {
    content = (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load clients"
        description={error?.message}
        action={<Button onClick={() => void refetch()}>Try again</Button>}
      />
    );
  } else if (clients.length === 0) {
    content = (
      <EmptyState
        icon={Users}
        title="No clients yet"
        description="Mark a lead as won to convert it, or add a client directly."
        action={
          <Button variant="primary" icon={Plus} onClick={openNew}>
            Add client
          </Button>
        }
      />
    );
  } else {
    content = <ClientsTable clients={clients} onOpenClient={openClient} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {clients && clients.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            MRR{' '}
            <span className="font-display text-md font-semibold text-primary tabular-nums">
              {formatZAR(monthlyRecurring(clients))}
            </span>
            <span className="ml-1.5 text-xs">from active clients</span>
          </p>
          <Button icon={Plus} onClick={openNew}>
            Add client
          </Button>
        </div>
      )}

      {content}

      {creating && <NewClientDrawer onClose={closeNew} />}
    </div>
  );
}
