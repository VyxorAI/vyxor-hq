import { Link } from 'react-router-dom';
import { Badge } from '@/components/Badge';
import { DueDate } from '@/components/DueDate';
import { PROJECT_STATUS_META, PROJECT_TYPE_LABELS } from '../constants';
import type { Project } from '../types';

interface ProjectRowProps {
  project: Project;
  clientName?: string;
  progress?: { done: number; total: number };
  /** Show the status badge (off when rows are already grouped by status). */
  showStatus?: boolean;
}

export function ProjectRow({ project, clientName, progress, showStatus = false }: ProjectRowProps) {
  const done = progress?.done ?? 0;
  const total = progress?.total ?? 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const status = PROJECT_STATUS_META[project.status];

  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        to={`/projects/${project.id}`}
        className="flex flex-col gap-2 px-3 py-3 transition-colors hover:bg-raised sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{project.name}</p>
          <p className="truncate text-xs text-muted">
            {clientName ?? 'Unknown client'} · {PROJECT_TYPE_LABELS[project.type]}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {showStatus && <Badge tone={status.tone}>{status.label}</Badge>}
          <DueDate date={project.due_date} highlight={project.status !== 'live'} />
          <div className="flex w-32 items-center gap-2" title={`${done} of ${total} tasks done`}>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised" aria-hidden>
              <div className="h-full rounded-full bg-accent-teal" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs text-muted tabular-nums">
              {done}/{total}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
