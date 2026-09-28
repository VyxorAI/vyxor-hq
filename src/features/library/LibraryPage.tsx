import { AlertCircle, FilterX, LibraryBig, Plus, Search } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Select } from '@/components/Input';
import { Spinner } from '@/components/Spinner';
import { cn } from '@/lib/cn';
import { oneOf, useUrlFilters } from '@/lib/useUrlFilters';
import { useUpdateParams } from '@/lib/useUpdateParams';
import { useAssets } from './api';
import { AssetCard } from './components/AssetCard';
import { ASSET_TYPE_META, ASSET_TYPE_OPTIONS } from './constants';
import { NewAssetDrawer } from './NewAssetDrawer';
import type { AssetType } from './types';
import { useAssetActions } from './useAssetActions';

const FILTER_KEYS = ['q', 'type', 'tags'] as const;
const TYPES = Object.keys(ASSET_TYPE_META) as AssetType[];

/** /library: files, SOPs and prompts. URL state: `new=1`, search, type and tags (comma-separated). */
export function LibraryPage() {
  const [params, updateParams] = useUpdateParams();
  const { values, setFilter, clearFilters, activeCount } = useUrlFilters(FILTER_KEYS);
  const { data: assets, isPending, error, refetch } = useAssets();
  const { copy, download } = useAssetActions();

  const creating = params.get('new') === '1';
  const openNew = () => updateParams((p) => p.set('new', '1'));
  const closeNew = () => updateParams((p) => p.delete('new'), true);

  const type = oneOf(values.type, TYPES);
  const selectedTags = values.tags ? values.tags.split(',').filter(Boolean) : [];
  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag) ? selectedTags.filter((item) => item !== tag) : [...selectedTags, tag];
    setFilter('tags', next.join(','));
  };

  const allTags = [...new Set((assets ?? []).flatMap((asset) => asset.tags))].sort();
  const query = values.q.trim().toLowerCase();
  const visible = (assets ?? []).filter(
    (asset) =>
      (!type || asset.type === type) &&
      selectedTags.every((tag) => asset.tags.includes(tag)) &&
      (!query ||
        asset.title.toLowerCase().includes(query) ||
        (asset.content ?? '').toLowerCase().includes(query) ||
        (asset.file_name ?? '').toLowerCase().includes(query)),
  );

  let content;
  if (isPending) {
    content = (
      <div className="flex justify-center py-20">
        <Spinner label="Loading library" />
      </div>
    );
  } else if (!assets) {
    content = (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load the library"
        description={error?.message}
        action={<Button onClick={() => void refetch()}>Try again</Button>}
      />
    );
  } else if (assets.length === 0) {
    content = (
      <EmptyState
        icon={LibraryBig}
        title="The library is empty"
        description="Upload proposals and templates, or write your first SOP or prompt."
        action={
          <Button variant="primary" icon={Plus} onClick={openNew}>
            Add to library
          </Button>
        }
      />
    );
  } else if (visible.length === 0) {
    content = <EmptyState icon={FilterX} title="Nothing matches" action={<Button onClick={clearFilters}>Clear filters</Button>} />;
  } else {
    content = (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {visible.map((asset) => (
          <AssetCard key={asset.id} asset={asset} onCopy={copy} onDownload={download} onTagClick={toggleTag} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={values.q}
            onChange={(event) => setFilter('q', event.target.value)}
            placeholder="Search titles and text"
            aria-label="Search the library"
            className="h-9 w-full rounded-control border border-border bg-raised pr-3 pl-8 text-sm text-primary focus:border-accent-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
          />
        </div>
        <Select
          aria-label="Filter by type"
          placeholder="All types"
          options={ASSET_TYPE_OPTIONS}
          value={type}
          onChange={(event) => setFilter('type', event.target.value)}
          className="flex-1 sm:w-44 sm:flex-none"
        />
        {activeCount > 0 && (
          <Button variant="ghost" icon={FilterX} onClick={clearFilters}>
            Clear
          </Button>
        )}
        <Button icon={Plus} onClick={openNew} className="ml-auto">
          Add to library
        </Button>
      </div>

      {allTags.length > 0 && (
        <div role="group" aria-label="Filter by tag" className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={active}
                onClick={() => toggleTag(tag)}
                className={cn(
                  'rounded-control border px-2 py-0.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-accent-purple/60 bg-accent-purple/15 text-accent-purple'
                    : 'border-border text-muted hover:text-primary',
                )}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {content}

      {creating && <NewAssetDrawer onClose={closeNew} />}
    </div>
  );
}
