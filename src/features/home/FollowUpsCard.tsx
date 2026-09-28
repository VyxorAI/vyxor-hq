import { Link } from 'react-router-dom';
import { OwnerAvatar } from '@/components/OwnerAvatar';
import { useProfileMap } from '@/features/auth/profiles';
import { FollowUpDate } from '@/features/leads/components/FollowUpDate';
import { StageBadge } from '@/features/leads/components/StageBadge';
import { OPEN_STAGES } from '@/features/leads/constants';
import type { Lead } from '@/features/leads/types';
import { todayISO } from '@/lib/format';
import { CardEmpty, HomeCard } from './HomeCard';

const SHOWN = 8;

/** Open leads whose follow-up is today or overdue, oldest first. */
export function FollowUpsCard({ leads }: { leads: Lead[] }) {
  const profiles = useProfileMap();
  const today = todayISO();
  const due = leads
    .filter((lead) => OPEN_STAGES.includes(lead.stage) && lead.next_follow_up !== null && lead.next_follow_up <= today)
    .sort((a, b) => (a.next_follow_up ?? '').localeCompare(b.next_follow_up ?? ''));

  return (
    <HomeCard id="home-follow-ups" title="Follow-ups due today" count={due.length} link={{ to: '/leads', label: 'Pipeline' }}>
      {due.length === 0 ? (
        <CardEmpty>No follow-ups due. Nice.</CardEmpty>
      ) : (
        <ul>
          {due.slice(0, SHOWN).map((lead) => (
            <li key={lead.id} className="border-b border-border last:border-b-0">
              <Link to={`/leads?lead=${lead.id}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-raised">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{lead.business_name}</span>
                  {lead.contact_name && <span className="block truncate text-xs text-muted">{lead.contact_name}</span>}
                </span>
                <span className="hidden sm:inline-flex">
                  <StageBadge stage={lead.stage} />
                </span>
                <FollowUpDate date={lead.next_follow_up} stage={lead.stage} />
                <OwnerAvatar owner={lead.owner_id ? profiles.get(lead.owner_id) : undefined} />
              </Link>
            </li>
          ))}
          {due.length > SHOWN && (
            <li className="px-4 py-2 text-xs text-muted">
              And {due.length - SHOWN} more in the{' '}
              <Link to="/leads?view=table" className="text-accent-blue hover:underline">
                table view
              </Link>
              .
            </li>
          )}
        </ul>
      )}
    </HomeCard>
  );
}
