import { Link, useParams } from 'react-router-dom';
import { AlertCircle, SearchX } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { Tabs, type TabItem } from '@/components/Tabs';
import { oneOf } from '@/lib/useUrlFilters';
import { useUpdateParams } from '@/lib/useUpdateParams';
import { useClients } from './api';
import { ClientHeader } from './detail/ClientHeader';
import { ClientOverview } from './detail/ClientOverview';
import { ClientProjectsTab } from './detail/ClientProjectsTab';
import { ClientTasksTab } from './detail/ClientTasksTab';

type ClientTab = 'overview' | 'projects' | 'tasks' | 'invoices' | 'notes';

const TABS: ReadonlyArray<TabItem<ClientTab>> = [
  { value: 'overview', label: 'Overview' },
  { value: 'projects', label: 'Projects' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'invoices', label: 'Invoices', disabledHint: 'Phase 2' },
  { value: 'notes', label: 'Notes', disabledHint: 'Phase 3' },
];

const ENABLED_TABS: readonly ClientTab[] = ['overview', 'projects', 'tasks'];

/** /clients/:clientId. URL state: `tab` (overview by default). */
export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [params, updateParams] = useUpdateParams();
  const { data: clients, isPending, error, refetch } = useClients();

  const tab = oneOf(params.get('tab'), ENABLED_TABS) || 'overview';
  const setTab = (next: ClientTab) =>
    updateParams((p) => (next === 'overview' ? p.delete('tab') : p.set('tab', next)), true);

  if (isPending) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading client" />
      </div>
    );
  }

  if (!clients) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load this client"
        description={error?.message}
        action={<Button onClick={() => void refetch()}>Try again</Button>}
      />
    );
  }

  const client = clients.find((item) => item.id === clientId);
  if (!client) {
    return (
      <EmptyState
        icon={SearchX}
        title="Client not found"
        description="It may have been deleted."
        action={
          <Link to="/clients" className="font-medium text-accent-blue hover:underline">
            Back to clients
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ClientHeader client={client} />
      <Tabs label="Client sections" items={TABS} value={tab} onChange={setTab} idPrefix="client" />
      <div id="client-panel" role="tabpanel" aria-labelledby={`client-tab-${tab}`}>
        {tab === 'overview' && <ClientOverview key={client.id} client={client} />}
        {tab === 'projects' && <ClientProjectsTab client={client} />}
        {tab === 'tasks' && <ClientTasksTab client={client} />}
      </div>
    </div>
  );
}
