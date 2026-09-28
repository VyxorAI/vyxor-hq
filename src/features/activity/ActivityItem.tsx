import { ArrowRight, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/Button';
import type { Profile } from '@/features/auth/profiles';
import { formatRelative } from '@/lib/format';
import { describeChange, kindIcon } from './describe';
import type { Activity } from './types';

interface ActivityItemProps {
  activity: Activity;
  author: Profile | undefined;
  /** e.g. "From the lead" when a client page shows its lead's history. */
  origin?: string;
  onDelete?: (activity: Activity) => void;
}

export function ActivityItem({ activity, author, origin, onDelete }: ActivityItemProps) {
  const Icon = kindIcon(activity);
  const change = describeChange(activity);
  const name = author?.full_name.split(' ')[0] ?? 'Automation';
  const manual = !change;

  return (
    <li className="group relative flex gap-3 pb-5 last:pb-0">
      {/* Timeline rail */}
      <span aria-hidden className="absolute top-8 bottom-0 left-4 w-px bg-border group-last:hidden" />
      {author ? (
        <Avatar name={author.full_name} src={author.avatar_url} size="md" />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-raised text-muted">
          <Icon className="size-4" aria-hidden />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Icon className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            <span className="font-medium text-primary">{name}</span>
            {change ? (activity.kind === 'stage_change' ? ' moved this' : ' changed the status') : ` · ${activity.kind}`}
            {origin && <span> · {origin}</span>}
          </span>
          <time dateTime={activity.created_at} title={new Date(activity.created_at).toLocaleString('en-ZA')} className="ml-auto shrink-0">
            {formatRelative(activity.created_at)}
          </time>
          {manual && onDelete && (
            <IconButton
              icon={Trash2}
              label="Delete"
              size="sm"
              onClick={() => onDelete(activity)}
              className="-my-1 size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-danger"
            />
          )}
        </div>

        {change ? (
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-muted">{change.from}</span>
            <ArrowRight className="size-3.5 text-muted" aria-label="to" />
            <span className="font-medium">{change.to}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm break-words whitespace-pre-line">{activity.body}</p>
        )}
      </div>
    </li>
  );
}
