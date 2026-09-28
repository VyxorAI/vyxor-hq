import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, FolderKanban, ListChecks, Target, Users, type LucideIcon } from 'lucide-react';
import { activityVerb, describeChange, kindIcon } from '@/features/activity/describe';
import type { Activity } from '@/features/activity/types';
import type { Profile } from '@/features/auth/profiles';
import type { Client } from '@/features/clients/types';
import type { Lead } from '@/features/leads/types';
import type { Invoice } from '@/features/money/types';
import type { Project } from '@/features/projects/types';
import type { Task } from '@/features/tasks/types';
import { formatRelative } from '@/lib/format';
import { CardEmpty, HomeCard } from './HomeCard';

interface FeedItem {
  key: string;
  icon: LucideIcon;
  text: ReactNode;
  at: string;
  href: string;
}

interface RecentActivityCardProps {
  activities: Activity[];
  profiles: Map<string, Profile>;
  leads: Lead[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  invoices: Invoice[];
}

const SHOWN = 12;

/** The activity log (notes, calls, stage and status changes) plus newly added records. */
export function RecentActivityCard({ activities, profiles, leads, clients, projects, tasks, invoices }: RecentActivityCardProps) {
  const names = new Map<string, { name: string; href: string }>([
    ...leads.map((lead) => [lead.id, { name: lead.business_name, href: `/leads?lead=${lead.id}` }] as const),
    ...clients.map((client) => [client.id, { name: client.business_name, href: `/clients/${client.id}?tab=notes` }] as const),
    ...projects.map((project) => [project.id, { name: project.name, href: `/projects/${project.id}?tab=activity` }] as const),
  ]);

  const logged: FeedItem[] = activities.flatMap((activity) => {
    const target = names.get(activity.entity_id);
    if (!target) return [];
    const who = activity.user_id ? (profiles.get(activity.user_id)?.full_name.split(' ')[0] ?? 'Someone') : 'Automation';
    const change = describeChange(activity);
    const text = (
      <>
        <span className="text-muted">{who} {activityVerb(activity)} </span>
        <span className="font-medium">{target.name}</span>
        {change && (
          <span className="text-muted">
            {' '}
            <ArrowRight className="inline size-3 align-[-1px]" aria-label="to" /> {change.to}
          </span>
        )}
        {activity.body && <span className="text-muted">: {activity.body}</span>}
      </>
    );
    return [{ key: `activity-${activity.id}`, icon: kindIcon(activity), text, at: activity.created_at, href: target.href }];
  });

  const added = (icon: LucideIcon, kind: string, title: string, at: string, href: string, key: string): FeedItem => ({
    key,
    icon,
    at,
    href,
    text: (
      <>
        <span className="text-muted">Added {kind} </span>
        <span className="font-medium">{title}</span>
      </>
    ),
  });

  const items = [
    ...logged,
    ...leads.map((lead) => added(Target, 'lead', lead.business_name, lead.created_at, `/leads?lead=${lead.id}`, `lead-${lead.id}`)),
    ...clients.map((client) => added(Users, 'client', client.business_name, client.created_at, `/clients/${client.id}`, `client-${client.id}`)),
    ...projects.map((project) => added(FolderKanban, 'project', project.name, project.created_at, `/projects/${project.id}`, `project-${project.id}`)),
    ...tasks.map((task) =>
      added(ListChecks, 'task', task.title, task.created_at, `/projects/${task.project_id ?? 'general'}?task=${task.id}`, `task-${task.id}`),
    ),
    ...invoices.map((invoice) => added(FileText, 'invoice', invoice.number, invoice.created_at, `/money?invoice=${invoice.id}`, `invoice-${invoice.id}`)),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, SHOWN);

  return (
    <HomeCard id="home-activity" title="Recent activity">
      {items.length === 0 ? (
        <CardEmpty>Nothing yet. Add a lead to get started.</CardEmpty>
      ) : (
        <ul>
          {items.map(({ key, icon: Icon, text, at, href }) => (
            <li key={key} className="border-b border-border last:border-b-0">
              <Link to={href} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-raised">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-control bg-raised text-muted">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate">{text}</span>
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
