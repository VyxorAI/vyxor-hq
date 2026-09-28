import { Spinner } from '@/components/Spinner';
import { useCurrentProfile } from '@/features/auth/profiles';
import { useClients } from '@/features/clients/api';
import { monthlyRecurring } from '@/features/clients/table/filters';
import { useLeads } from '@/features/leads/api';
import { OPEN_STAGES } from '@/features/leads/constants';
import { useInvoices } from '@/features/money/api';
import { useProjects } from '@/features/projects/api';
import { useTasks } from '@/features/tasks/api';
import { TaskDrawerHost } from '@/features/tasks/TaskDrawerHost';
import { addDaysISO, formatZAR, todayISO } from '@/lib/format';
import { FollowUpsCard } from './FollowUpsCard';
import { MyTasksCard } from './MyTasksCard';
import { PulseStrip } from './PulseStrip';
import { RecentActivityCard } from './RecentActivityCard';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export function HomePage() {
  const profile = useCurrentProfile();
  const leadsQuery = useLeads();
  const clientsQuery = useClients();
  const tasksQuery = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: invoices = [] } = useInvoices();

  if (leadsQuery.isPending || clientsQuery.isPending || tasksQuery.isPending) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading home" />
      </div>
    );
  }

  const leads = leadsQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const openLeads = leads.filter((lead) => OPEN_STAGES.includes(lead.stage));
  const pipeline = openLeads.reduce((sum, lead) => sum + (lead.estimated_monthly ?? 0), 0);
  const activeClients = clients.filter((client) => client.status === 'active').length;

  const today = todayISO();
  const weekEnd = addDaysISO(today, 6);
  const dueThisWeek = tasks.filter((task) => task.status !== 'done' && task.due_date !== null && task.due_date <= weekEnd);
  const mineDue = dueThisWeek.filter((task) => task.assignee_id === profile?.id).length;
  const overdue = dueThisWeek.filter((task) => (task.due_date as string) < today).length;

  const firstName = profile?.full_name.split(' ')[0];

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted">
        {greeting()}
        {firstName ? `, ${firstName}` : ''}. Here's where things stand.
      </p>

      <PulseStrip
        items={[
          { label: 'MRR', value: formatZAR(monthlyRecurring(clients)), hint: plural(activeClients, 'active client', 'active clients') },
          { label: 'Pipeline value', value: formatZAR(pipeline), suffix: '/mo', hint: plural(openLeads.length, 'open lead', 'open leads') },
          {
            label: 'Tasks due this week',
            value: String(dueThisWeek.length),
            hint: `${mineDue} yours${overdue > 0 ? ` · ${overdue} overdue` : ''}`,
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <FollowUpsCard leads={leads} />
        <MyTasksCard tasks={tasks} profileId={profile?.id} />
      </div>

      <RecentActivityCard leads={leads} clients={clients} projects={projects} tasks={tasks} invoices={invoices} />

      <TaskDrawerHost defaults={{ assigneeId: profile?.id }} />
    </div>
  );
}
