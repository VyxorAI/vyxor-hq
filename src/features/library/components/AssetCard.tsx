import { Link } from 'react-router-dom';
import { Copy, Download, Paperclip } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { formatBytes, formatRelative } from '@/lib/format';
import { ASSET_TYPE_META } from '../constants';
import type { Asset } from '../types';

interface AssetCardProps {
  asset: Asset;
  onCopy: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onTagClick: (tag: string) => void;
}

/** Strip markdown symbols for a short plain-text preview. */
function excerpt(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[[ xX]\]/g, ' ') // task list boxes
    .replace(/[#>*`~|[\]()]|(^|\s)[-_]+(?=\s)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

export function AssetCard({ asset, onCopy, onDownload, onTagClick }: AssetCardProps) {
  const meta = ASSET_TYPE_META[asset.type];
  const Icon = meta.icon;
  const isFile = Boolean(asset.file_path);

  return (
    <article className="group relative flex flex-col gap-3 rounded-card border border-border bg-surface p-4 transition-colors hover:border-accent-blue/50">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-raised text-muted">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-sm font-semibold">
            {/* Stretched link: the whole card opens the item; buttons sit above it */}
            <Link to={`/library/${asset.id}`} className="line-clamp-2 after:absolute after:inset-0 after:rounded-card hover:text-accent-blue">
              {asset.title}
            </Link>
          </h3>
          <div className="mt-1">
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
        </div>
      </div>

      {isFile ? (
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Paperclip className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{asset.file_name}</span>
          <span className="shrink-0 tabular-nums">· {formatBytes(asset.file_size)}</span>
        </p>
      ) : (
        <p className="line-clamp-3 text-xs leading-relaxed text-muted">{excerpt(asset.content ?? '') || 'Empty document'}</p>
      )}

      {asset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {asset.tags.slice(0, 4).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              className="relative z-10 rounded-control bg-raised px-1.5 py-0.5 text-xs text-muted hover:text-primary"
            >
              #{tag}
            </button>
          ))}
          {asset.tags.length > 4 && <span className="px-1 text-xs text-muted">+{asset.tags.length - 4}</span>}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted">Updated {formatRelative(asset.updated_at ?? asset.created_at)}</span>
        {isFile ? (
          <Button size="sm" icon={Download} onClick={() => onDownload(asset)} className="relative z-10">
            Download
          </Button>
        ) : (
          <Button size="sm" icon={Copy} onClick={() => onCopy(asset)} className="relative z-10">
            Copy
          </Button>
        )}
      </div>
    </article>
  );
}
