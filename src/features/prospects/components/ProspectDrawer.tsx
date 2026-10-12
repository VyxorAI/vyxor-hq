import type { ReactNode } from 'react';
import { Drawer } from '@/components/Drawer';
import { Spinner } from '@/components/Spinner';
import { formatRelative } from '@/lib/format';
import { needsDescriptionLookup, useProspectDescription } from '../api';
import type { Prospect, ProspectTab } from '../types';
import { ContactLinks, PitchBadge, PriorityBadge, ProspectActions, Rating, type ProspectActionHandlers } from './bits';

interface ProspectDrawerProps {
  prospect: Prospect | null;
  tab: ProspectTab;
  handlers: ProspectActionHandlers;
  onClose: () => void;
}

const SOURCE_LABEL: Record<string, string> = {
  website: 'From their website',
  google: 'From Google',
};

/** What we can say about a business that hasn't published a description. */
function summaryFromFacts(prospect: Prospect): string {
  const listing = [prospect.category ? `Listed under ${prospect.category}` : 'A local business', prospect.area && `in ${prospect.area}`]
    .filter(Boolean)
    .join(' ');
  const reviews =
    prospect.rating === null
      ? 'No Google reviews yet'
      : `Rated ${Number(prospect.rating).toFixed(1)} from ${prospect.review_count ?? 0} Google ${prospect.review_count === 1 ? 'review' : 'reviews'}`;

  let site: string;
  if (!prospect.website) site = 'No website listed on Google';
  else if (!prospect.website_checked_at) site = 'Has a website';
  else if (prospect.has_whatsapp === null) site = "Their website didn't load when checked";
  else if (prospect.has_whatsapp && prospect.has_booking) site = 'Their website has WhatsApp and online booking';
  else if (prospect.has_whatsapp) site = 'Their website has WhatsApp but no online booking';
  else if (prospect.has_booking) site = 'Their website has online booking but no WhatsApp';
  else site = 'Their website has no WhatsApp or online booking';

  return `${listing}. ${reviews}. ${site}.`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h3 className="text-sm">{title}</h3>
      {children}
    </section>
  );
}

function Found({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-muted">Site didn't load</span>;
  return <span className={value ? 'text-accent-teal' : 'text-muted'}>{value ? 'Yes' : 'Not found'}</span>;
}

/** One business in full: what it does, how to reach it and what to pitch. */
export function ProspectDrawer({ prospect, tab, handlers, onClose }: ProspectDrawerProps) {
  const lookup = useProspectDescription(prospect);
  if (!prospect) return null;

  const reading = lookup.isFetching && needsDescriptionLookup(prospect);

  // An action opens its own dialog or moves the business out of this list, so close first
  const closeThen =
    (action: (prospect: Prospect) => void) =>
    (target: Prospect) => {
      onClose();
      action(target);
    };
  const drawerHandlers: ProspectActionHandlers = {
    ...handlers,
    onContacted: closeThen(handlers.onContacted),
    onDismiss: closeThen(handlers.onDismiss),
    onDoNotContact: closeThen(handlers.onDoNotContact),
    onRestore: closeThen(handlers.onRestore),
    onClearDoNotContact: closeThen(handlers.onClearDoNotContact),
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={prospect.business_name}
      subtitle={<p className="text-xs text-muted">{[prospect.category, prospect.area].filter(Boolean).join(' · ')}</p>}
      footer={
        <div className="ml-auto">
          <ProspectActions prospect={prospect} tab={tab} handlers={drawerHandlers} />
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Section title="About">
          {prospect.description ? (
            <>
              <p className="text-sm leading-relaxed">{prospect.description}</p>
              <p className="text-xs text-muted">{SOURCE_LABEL[prospect.description_source ?? ''] ?? 'Description'}</p>
            </>
          ) : reading ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Spinner label="Reading their website" />
              Reading their website…
            </p>
          ) : (
            <>
              <p className="text-sm leading-relaxed">{summaryFromFacts(prospect)}</p>
              <p className="text-xs text-muted">
                {prospect.website ? 'No description on their website or Google.' : 'No description on Google, and no website to read.'}
              </p>
            </>
          )}
        </Section>

        <Section title="Contact">
          <ContactLinks prospect={prospect} className="text-sm" />
          {prospect.address && <p className="text-xs text-muted">{prospect.address}</p>}
        </Section>

        <Section title="Suggested pitch">
          <div className="flex flex-wrap items-center gap-2">
            <PitchBadge prospect={prospect} />
            <PriorityBadge score={prospect.score} />
            <Rating prospect={prospect} />
          </div>
          {prospect.pitch_reason && <p className="text-sm text-muted">{prospect.pitch_reason}</p>}
        </Section>

        {prospect.website && (
          <Section title="Website check">
            {prospect.website_checked_at ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted">WhatsApp</dt>
                <dd>
                  <Found value={prospect.has_whatsapp} />
                </dd>
                <dt className="text-muted">Online booking</dt>
                <dd>
                  <Found value={prospect.has_booking} />
                </dd>
                <dt className="text-muted">Checked</dt>
                <dd>{formatRelative(prospect.website_checked_at)}</dd>
              </dl>
            ) : (
              <p className="text-sm text-muted">Not checked yet.</p>
            )}
          </Section>
        )}
      </div>
    </Drawer>
  );
}
