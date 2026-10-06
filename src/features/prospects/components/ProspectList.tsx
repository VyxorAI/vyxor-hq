import { formatRelative } from '@/lib/format';
import type { Profile } from '@/features/auth/profiles';
import type { Prospect, ProspectTab } from '../types';
import {
  ContactLinks,
  PitchBadge,
  PriorityBadge,
  ProspectActions,
  Rating,
  type ProspectActionHandlers,
} from './bits';

interface ProspectListProps {
  prospects: Prospect[];
  tab: ProspectTab;
  handlers: ProspectActionHandlers;
  profiles: Map<string, Profile>;
}

function Business({ prospect }: { prospect: Prospect }) {
  return (
    <div className="min-w-0">
      <p className="font-medium break-words">{prospect.business_name}</p>
      <p className="truncate text-xs text-muted">{[prospect.category, prospect.area].filter(Boolean).join(' · ')}</p>
    </div>
  );
}

function Pitch({ prospect }: { prospect: Prospect }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <PitchBadge prospect={prospect} />
      {prospect.pitch_reason && <p className="text-xs leading-snug text-muted">{prospect.pitch_reason}</p>}
    </div>
  );
}

function ContactedBy({ prospect, profiles }: { prospect: Prospect; profiles: Map<string, Profile> }) {
  if (!prospect.contacted_at) return null;
  const who = prospect.contacted_by ? profiles.get(prospect.contacted_by)?.full_name.split(' ')[0] : undefined;
  return (
    <p className="text-xs text-muted">
      {who ? `${who}, ` : ''}
      {formatRelative(prospect.contacted_at)}
    </p>
  );
}

/** Table on desktop, cards on phones (where click-to-call matters most). */
export function ProspectList({ prospects, tab, handlers, profiles }: ProspectListProps) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-card border border-border bg-surface md:block">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-medium">Business</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Priority</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Google</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Contact</th>
              <th scope="col" className="w-72 px-3 py-2.5 font-medium">Suggested pitch</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                {tab === 'converted' ? 'Contacted' : <span className="sr-only">Actions</span>}
              </th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((prospect) => (
              <tr key={prospect.id} className="border-b border-border align-top last:border-b-0 hover:bg-raised/40">
                <td className="max-w-64 px-3 py-3">
                  <Business prospect={prospect} />
                </td>
                <td className="px-3 py-3">
                  <PriorityBadge score={prospect.score} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Rating prospect={prospect} />
                </td>
                <td className="max-w-60 px-3 py-3">
                  <ContactLinks prospect={prospect} />
                </td>
                <td className="px-3 py-3">
                  <Pitch prospect={prospect} />
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <div className="flex flex-col items-end gap-1">
                    <ProspectActions prospect={prospect} tab={tab} handlers={handlers} />
                    {tab === 'converted' && <ContactedBy prospect={prospect} profiles={profiles} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone */}
      <ul className="flex flex-col gap-2 md:hidden">
        {prospects.map((prospect) => (
          <li key={prospect.id} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <Business prospect={prospect} />
              <PriorityBadge score={prospect.score} />
            </div>
            <Rating prospect={prospect} />
            <ContactLinks prospect={prospect} />
            <Pitch prospect={prospect} />
            <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
              {tab === 'converted' ? <ContactedBy prospect={prospect} profiles={profiles} /> : <span />}
              <ProspectActions prospect={prospect} tab={tab} handlers={handlers} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
