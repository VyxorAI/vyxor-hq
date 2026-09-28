import { Link } from 'react-router-dom';
import { FileText, FolderKanban, ListChecks, Target, Users, type LucideIcon } from 'lucide-react';
import type { Client } from '@/features/clients/types';
import type { Lead } from '@/features/leads/types';
import type { Invoice } from '@/features/money/types';
import type { Project } from '@/features/projects/types';
import type { Task } from '@/features/tasks/types';
import { formatRelative } from '@/lib/format';
import { CardEmpty, HomeCard } from './HomeCard';

interface ActivityItem {
  key: string;
  icon: LucideIcon;
  kind: string;
  title: string;
  verb: 'Added' | 'Updated';
  at: string;
  href: string;
}

interface Stamped {
  id: string;
  created_at: string;
  updated_at: string | null;
}

/** "Updated" only when the last change came well after creation. */
function stamp(record: Stamped): Pick<ActivityItem, 'verb' | 'at'> {
  const edited =
    record.updated_at !== null && new Date(record.updated_at).getTime() - new Date(record.created_at).getTime() > 60_000;
  return { verb: edited ? 'Updated' : 'Added', at: edited ? (record.updated_at as string) : record.created_at };
}

interface RecentActivityCardProps {
  leads: Lead[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  invoices: Invoice[];
}

/**
 * Most recently added or changed records, from their timestamps. The full
 * activity log (notes, calls, stage changes) arrives in Phase 3.
 */
export function RecentActivityCard({ leads, clients, projects, tasks, invoices }: RecentActivityCardProps) {
  const items: ActivityItem[] = [
    ...leads.map((lead) => ({
      key: `lead-${lead.id}`,
      icon: Target,
      kind: 'Lead',
      title: lead.business_name,
      href: `/leads?lead=${lead.id}`,
      ...stamp(lead),
    })),
    ...clients.map((client) => ({
      key: `client-${client.id}`,
      icon: Users,
      kind: 'Client',
      title: client.business_name,
      href: `/clients/${client.id}`,
      ...stamp(client),
    })),
    ...projects.map((project) => ({
      key: `project-${project.id}`,
      icon: FolderKanban,
      kind: 'Project',
      title: project.name,
      href: `/projects/${project.id}`,
      ...stamp(project),
    })),
    ...tasks.map((task) => ({
      key: `task-${task.id}`,
      icon: ListChecks,
      kind: 'Task',
      title: task.title,
      href: `/projects/${task.project_id ?? 'general'}?task=${task.id}`,
      ...stamp(task),
    })),
    ...invoices.map((invoice) => ({
      key: `invoice-${invoice.id}`,
      icon: FileText,
      kind: 'Invoice',
      title: invoice.number,
      href: `/money?invoice=${invoice.id}`,
      ...stamp(invoice),
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);

  return (
    <HomeCard id="home-activity" title="Recent activity">
      {items.length === 0 ? (
        <CardEmpty>Nothing yet. Add a lead to get started.</CardEmpty>
      ) : (
        <ul>
          {items.map(({ key, icon: Icon, kind, title, verb, at, href }) => (
            <li key={key} className="border-b border-border last:border-b-0">
              <Link to={href} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-raised">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-control bg-raised text-muted">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="text-muted">
                    {verb} {kind.toLowerCase()}{' '}
                  </span>
                  <span className="font-medium">{title}</span>
                </span>
                <time dateTime={at} className="shrink-0 text-xs text-muted" title={new Date(at).toLocaleString('en-ZA')}>
                  {formatRelative(at)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </HomeCard>
  );
}
