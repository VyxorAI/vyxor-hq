import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { Field } from '@/components/Field';
import { FormSection } from '@/components/FormSection';
import { Input, Select } from '@/components/Input';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import type { LeadIndustry } from '@/features/leads/types';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/errors';
import { formatRelative } from '@/lib/format';
import { INDUSTRY_OPTIONS } from '@/lib/labels';
import { useAddSearches, useProspectSearches, useSetSearchesActive } from '../api';
import { SEARCHES_PER_DAY } from '../constants';
import type { ProspectSearch } from '../types';

/** Turn category/area searches on or off, and add new ones. */
export function SearchesDrawer({ onClose }: { onClose: () => void }) {
  const { data: searches, isPending } = useProspectSearches();
  const setActive = useSetSearchesActive();
  const toast = useToast();

  const byCategory = new Map<string, ProspectSearch[]>();
  for (const search of searches ?? []) {
    byCategory.set(search.category, [...(byCategory.get(search.category) ?? []), search]);
  }
  const activeCount = (searches ?? []).filter((search) => search.active).length;
  const areas = [...new Set((searches ?? []).map((search) => search.area))].sort();
  const refreshDays = Math.max(1, Math.ceil(activeCount / SEARCHES_PER_DAY));

  function toggle(ids: string[], active: boolean) {
    setActive.mutate({ ids, active }, { onError: (error) => toast.error(`Couldn't update. ${errorMessage(error)}`) });
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Searches"
      subtitle={
        <p className="text-xs text-muted">
          {activeCount} active. The daily run does {SEARCHES_PER_DAY}, oldest first, so each is refreshed{' '}
          {refreshDays <= 1 ? 'daily' : `about every ${refreshDays} days`}.
        </p>
      }
    >
      {isPending ? (
        <div className="flex justify-center py-10">
          <Spinner label="Loading searches" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {[...byCategory.entries()].map(([category, rows]) => {
            const on = rows.filter((row) => row.active);
            return (
              <section key={category} aria-label={category} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm">
                    {category}
                    <span className="ml-2 font-sans text-xs font-normal text-muted">
                      {on.length} of {rows.length} areas
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggle(rows.map((row) => row.id), on.length < rows.length)}
                    className="text-xs font-medium text-accent-blue hover:underline"
                  >
                    {on.length < rows.length ? 'Turn all on' : 'Turn all off'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {rows.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      aria-pressed={row.active}
                      onClick={() => toggle([row.id], !row.active)}
                      title={row.last_run_at ? `Last searched ${formatRelative(row.last_run_at)}, ${row.last_result_count ?? 0} new` : 'Not searched yet'}
                      className={cn(
                        'rounded-control border px-2 py-1 text-xs font-medium transition-colors',
                        row.active
                          ? 'border-accent-blue/50 bg-accent-blue/10 text-primary'
                          : 'border-border text-muted line-through hover:text-primary',
                      )}
                    >
                      {row.area}
                    </button>
                  ))}
                </div>
              </section>
            );
          })}

          <AddSearchForm knownAreas={areas} />
        </div>
      )}
    </Drawer>
  );
}

function AddSearchForm({ knownAreas }: { knownAreas: string[] }) {
  const toast = useToast();
  const addSearches = useAddSearches();
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState<LeadIndustry>('other');
  const [areas, setAreas] = useState(knownAreas.join(', '));

  const areaList = areas.split(',').map((area) => area.trim()).filter(Boolean);
  const valid = category.trim() && query.trim() && areaList.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) return;
    addSearches.mutate(
      { category, query, industry, areas: areaList },
      {
        onSuccess: () => {
          toast.success(`Added ${category.trim()} in ${areaList.length} ${areaList.length === 1 ? 'area' : 'areas'}.`);
          setCategory('');
          setQuery('');
        },
        onError: (error) => toast.error(`Couldn't add the search. ${errorMessage(error)}`),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border pt-5">
      <FormSection title="Add a search">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor="search-category" hint="Shown in the list, e.g. Optometrists.">
            <Input id="search-category" value={category} onChange={(event) => setCategory(event.target.value)} />
          </Field>
          <Field label="Search words" htmlFor="search-query" hint="What you'd type into Google Maps.">
            <Input id="search-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="optometrist" />
          </Field>
        </div>
        <Field label="Industry when it becomes a lead" htmlFor="search-industry">
          <Select
            id="search-industry"
            options={INDUSTRY_OPTIONS}
            value={industry}
            onChange={(event) => setIndustry(event.target.value as LeadIndustry)}
          />
        </Field>
        <Field label="Areas" htmlFor="search-areas" hint="Comma-separated. Each area is searched in Cape Town.">
          <Input id="search-areas" value={areas} onChange={(event) => setAreas(event.target.value)} />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" icon={Plus} loading={addSearches.isPending} disabled={!valid}>
            Add search
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
