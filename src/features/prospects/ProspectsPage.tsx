import { useState } from 'react';
import { AlertCircle, FilterX, Radar, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Select } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { StatTile } from '@/components/StatTile';
import { Tabs, type TabItem } from '@/components/Tabs';
import { useToast } from '@/components/Toast';
import { useProfileMap } from '@/features/auth/profiles';
import { useLeads } from '@/features/leads/api';
import { OFFER_OPTIONS } from '@/features/leads/constants';
import { errorMessage } from '@/lib/errors';
import { formatRelative, todayISO } from '@/lib/format';
import { oneOf, useUrlFilters } from '@/lib/useUrlFilters';
import { useUpdateParams } from '@/lib/useUpdateParams';
import { useProspects, useProspectSearches, useProspectStats, useRunProspectSearch, useUpdateProspect } from './api';
import type { ProspectActionHandlers } from './components/bits';
import { ContactedModal } from './components/ContactedModal';
import { ProspectList } from './components/ProspectList';
import { SearchesDrawer } from './components/SearchesDrawer';
import { SEARCHES_PER_DAY, TABS } from './constants';
import type { Prospect, ProspectTab } from './types';

const FILTER_KEYS = ['q', 'category', 'area', 'pitch', 'contact', 'sort'] as const;
const PAGE_SIZE = 100;

const CONTACT_OPTIONS = [
  { value: 'phone', label: 'Has a phone number' },
  { value: 'email', label: 'Has an email' },
] as const;
const SORT_OPTIONS = [
  { value: 'reviews', label: 'Most reviews' },
  { value: 'newest', label: 'Newest first' },
] as const;

/** /prospects: businesses found daily on Google, ready to call. */
export function ProspectsPage() {
  const toast = useToast();
  const profiles = useProfileMap();
  const [params, updateParams] = useUpdateParams();
  const { values, setFilter, clearFilters, activeCount } = useUrlFilters(FILTER_KEYS);
  const tab = (oneOf(params.get('tab'), ['new', 'converted', 'dismissed', 'dnc'] as const) || 'new') as ProspectTab;

  const { data: prospects, isPending, error, refetch } = useProspects(tab);
  const { data: stats } = useProspectStats();
  const { data: searches = [] } = useProspectSearches();
  const { data: leads = [] } = useLeads();
  const updateProspect = useUpdateProspect();
  const runSearch = useRunProspectSearch();

  const [contacting, setContacting] = useState<Prospect | null>(null);
  const [confirmDnc, setConfirmDnc] = useState<Prospect | null>(null);
  const [confirmClearDnc, setConfirmClearDnc] = useState<Prospect | null>(null);
  const [confirmRun, setConfirmRun] = useState(false);
  const [showSearches, setShowSearches] = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);

  const setTab = (next: ProspectTab) => {
    setShown(PAGE_SIZE);
    updateParams((p) => (next === 'new' ? p.delete('tab') : p.set('tab', next)), true);
  };

  // --- Header numbers ---------------------------------------------------------
  const lastRun = searches.reduce<string | null>((latest, search) => (search.last_run_at && (!latest || search.last_run_at > latest) ? search.last_run_at : latest), null);
  const todayStart = new Date(`${todayISO()}T00:00:00`).toISOString();
  const usedToday = searches.filter((search) => search.last_run_at && search.last_run_at >= todayStart).length;
  const leftToday = Math.max(0, SEARCHES_PER_DAY - usedToday);
  const convertedIds = new Set(stats?.convertedLeadIds ?? []);
  const won = leads.filter((lead) => convertedIds.has(lead.id) && lead.stage === 'won').length;

  // --- Filters ----------------------------------------------------------------
  const categories = [...new Set(searches.map((search) => search.category))].sort();
  const areas = [...new Set(searches.map((search) => search.area))].sort();
  const pitch = oneOf(values.pitch, OFFER_OPTIONS.map((option) => option.value));
  const query = values.q.trim().toLowerCase();
  const filtered = (prospects ?? []).filter(
    (prospect) =>
      (!values.category || prospect.category === values.category) &&
      (!values.area || prospect.area === values.area) &&
      (!pitch || prospect.suggested_offer === pitch) &&
      (values.contact !== 'phone' || prospect.phone) &&
      (values.contact !== 'email' || prospect.email) &&
      (!query ||
        [prospect.business_name, prospect.address, prospect.email, prospect.phone].join(' ').toLowerCase().includes(query)),
  );
  const sorted =
    values.sort === 'reviews'
      ? [...filtered].sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0))
      : values.sort === 'newest'
        ? [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at))
        : filtered; // priority: already ordered by the query

  // --- Actions ------------------------------------------------------------------
  function update(prospect: Prospect, changes: { status?: Prospect['status']; do_not_contact?: boolean }, message: string) {
    updateProspect.mutate(
      { id: prospect.id, changes },
      {
        onSuccess: () => toast.success(message),
        onError: (err) => toast.error(`Couldn't update it. ${errorMessage(err)}`),
      },
    );
  }

  const handlers: ProspectActionHandlers = {
    onContacted: setContacting,
    onDismiss: (prospect) => update(prospect, { status: 'dismissed' }, `${prospect.business_name} moved to Not a fit.`),
    onDoNotContact: setConfirmDnc,
    onRestore: (prospect) => update(prospect, { status: 'new' }, `${prospect.business_name} is back in To contact.`),
    onClearDoNotContact: setConfirmClearDnc,
    pendingId: updateProspect.isPending ? updateProspect.variables?.id : undefined,
  };

  function run() {
    runSearch.mutate(undefined, {
      onSuccess: (result) => {
        setConfirmRun(false);
        if (result.errors.length > 0) toast.error(`Search stopped: ${result.errors[0]}`);
        else if (result.searchesRun === 0) toast.error("Today's searches are used up. The next run is tomorrow at 06:00.");
        else toast.success(`${result.added} new ${result.added === 1 ? 'prospect' : 'prospects'} from ${result.searchesRun} searches. ${result.searchesLeftToday} left today.`);
      },
      onError: (err) => {
        setConfirmRun(false);
        toast.error(`Couldn't run the search. ${errorMessage(err)}`);
      },
    });
  }

  const tabItems: ReadonlyArray<TabItem<ProspectTab>> = TABS.map((item) => ({
    value: item.value,
    label: item.value === 'new' && stats ? `${item.label} (${stats.toContact})` : item.label,
  }));

  // --- Body ---------------------------------------------------------------------
  let body;
  if (isPending) {
    body = (
      <div className="flex justify-center py-20">
        <Spinner label="Loading prospects" />
      </div>
    );
  } else if (!prospects) {
    body = (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load prospects"
        description={error?.message}
        action={<Button onClick={() => void refetch()}>Try again</Button>}
      />
    );
  } else if (prospects.length === 0) {
    body =
      tab === 'new' ? (
        <EmptyState
          icon={Radar}
          title={lastRun ? 'Everyone has been contacted' : 'No prospects yet'}
          description={
            lastRun
              ? 'New businesses are added every morning at 06:00.'
              : 'The first search runs at 06:00 tomorrow, or you can find some now.'
          }
          action={
            leftToday > 0 && (
              <Button variant="primary" icon={Radar} onClick={() => setConfirmRun(true)}>
                Find prospects now
              </Button>
            )
          }
        />
      ) : (
        <EmptyState icon={Radar} title="Nothing here yet" />
      );
  } else if (sorted.length === 0) {
    body = <EmptyState icon={FilterX} title="No prospects match these filters" action={<Button onClick={clearFilters}>Clear filters</Button>} />;
  } else {
    body = (
      <div className="flex flex-col gap-3">
        <ProspectList prospects={sorted.slice(0, shown)} tab={tab} handlers={handlers} profiles={profiles} />
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span className="tabular-nums">
            Showing {Math.min(shown, sorted.length)} of {sorted.length}
          </span>
          {sorted.length > shown && (
            <Button size="sm" onClick={() => setShown((count) => count + PAGE_SIZE)}>
              Show more
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {lastRun ? `Last searched ${formatRelative(lastRun)}` : 'Not searched yet'}
          {stats && ` · ${stats.newToday} new today`}
          <span className="hidden sm:inline"> · next run 06:00</span>
        </p>
        <div className="flex gap-2">
          <Button icon={SlidersHorizontal} onClick={() => setShowSearches(true)}>
            Searches
          </Button>
          <Button icon={Radar} onClick={() => setConfirmRun(true)} disabled={leftToday === 0} title={leftToday === 0 ? "Today's searches are used up" : undefined}>
            Find more now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="To contact" value={String(stats?.toContact ?? '–')} hint="Waiting for a call" />
        <StatTile label="New today" value={String(stats?.newToday ?? '–')} hint="Found this morning" />
        <StatTile label="Moved to leads this week" value={String(stats?.movedThisWeek ?? '–')} hint="Contacted since Monday" />
        <StatTile label="Won from prospects" value={String(won)} hint={`Of ${convertedIds.size} moved to leads`} />
      </div>

      <div className="flex flex-col gap-4">
        <Tabs label="Prospect lists" items={tabItems} value={tab} onChange={setTab} idPrefix="prospects" />

        <div id="prospects-panel" role="tabpanel" aria-labelledby={`prospects-tab-${tab}`} className="flex flex-col gap-3">
          {tab === 'new' && (
            <p className="flex items-start gap-2 text-xs text-muted">
              <ShieldCheck className="mt-px size-3.5 shrink-0 text-accent-teal" aria-hidden />
              Call first. Only email or WhatsApp to ask permission to send information, and only once (POPIA). Mark anyone who
              says no as Do not contact.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <div className="relative col-span-2 sm:w-56">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                value={values.q}
                onChange={(event) => setFilter('q', event.target.value)}
                placeholder="Search name, address, phone"
                aria-label="Search prospects"
                className="h-9 w-full rounded-control border border-border bg-raised pr-3 pl-8 text-sm text-primary focus:border-accent-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
              />
            </div>
            <Select aria-label="Filter by category" placeholder="All categories" options={categories.map((c) => ({ value: c, label: c }))} value={values.category} onChange={(event) => setFilter('category', event.target.value)} className="sm:w-44" />
            <Select aria-label="Filter by area" placeholder="All areas" options={areas.map((a) => ({ value: a, label: a }))} value={values.area} onChange={(event) => setFilter('area', event.target.value)} className="sm:w-40" />
            <Select aria-label="Filter by pitch" placeholder="Any pitch" options={OFFER_OPTIONS} value={pitch} onChange={(event) => setFilter('pitch', event.target.value)} className="sm:w-48" />
            <Select aria-label="Filter by contact details" placeholder="Any contact details" options={CONTACT_OPTIONS} value={values.contact} onChange={(event) => setFilter('contact', event.target.value)} className="sm:w-48" />
            <Select aria-label="Sort" placeholder="Highest priority" options={SORT_OPTIONS} value={values.sort} onChange={(event) => setFilter('sort', event.target.value)} className="col-span-2 sm:w-44" />
            {activeCount > 0 && (
              <Button variant="ghost" icon={FilterX} onClick={clearFilters} className="col-span-2 sm:col-span-1">
                Clear
              </Button>
            )}
          </div>

          {body}
        </div>
      </div>

      <ContactedModal prospect={contacting} onClose={() => setContacting(null)} />

      <Modal
        open={confirmDnc !== null}
        onClose={() => setConfirmDnc(null)}
        title="Mark as do not contact?"
        description={`${confirmDnc?.business_name ?? 'This business'} won't appear in To contact again, and can't be moved to Leads.`}
        footer={
          <>
            <Button onClick={() => setConfirmDnc(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={updateProspect.isPending}
              onClick={() => {
                if (confirmDnc) update(confirmDnc, { do_not_contact: true, status: 'dismissed' }, `${confirmDnc.business_name} marked do not contact.`);
                setConfirmDnc(null);
              }}
            >
              Do not contact
            </Button>
          </>
        }
      />

      <Modal
        open={confirmClearDnc !== null}
        onClose={() => setConfirmClearDnc(null)}
        title="Remove do not contact?"
        description="Only do this if they've told you it's fine to contact them again."
        footer={
          <>
            <Button onClick={() => setConfirmClearDnc(null)}>Keep the flag</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (confirmClearDnc) update(confirmClearDnc, { do_not_contact: false, status: 'new' }, `${confirmClearDnc.business_name} is back in To contact.`);
                setConfirmClearDnc(null);
              }}
            >
              Remove flag
            </Button>
          </>
        }
      />

      <Modal
        open={confirmRun}
        onClose={() => !runSearch.isPending && setConfirmRun(false)}
        title="Find prospects now?"
        description={`Runs up to ${leftToday} of today's ${SEARCHES_PER_DAY} searches. The 06:00 run shares the same limit, which keeps it inside Google's free allowance. This can take up to two minutes.`}
        footer={
          <>
            <Button onClick={() => setConfirmRun(false)} disabled={runSearch.isPending}>
              Cancel
            </Button>
            <Button variant="primary" icon={Radar} loading={runSearch.isPending} onClick={run}>
              {runSearch.isPending ? 'Searching…' : 'Find prospects'}
            </Button>
          </>
        }
      />

      {showSearches && <SearchesDrawer onClose={() => setShowSearches(false)} />}
    </div>
  );
}
