import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Copy, Download, FileText, Pencil, SearchX, Trash2 } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { errorMessage } from '@/lib/errors';
import { formatBytes, formatRelative } from '@/lib/format';
import { useFormState } from '@/lib/useFormState';
import { useAssets, useDeleteAsset, useFileUrl, useSaveAsset } from './api';
import { MarkdownView } from './components/Markdown';
import { ASSET_TYPE_META } from './constants';
import { AssetFields } from './form/AssetFields';
import { toAssetFormValues, toAssetPayload, validateAsset } from './form/assetFormModel';
import type { Asset } from './types';
import { useAssetActions } from './useAssetActions';

/** Inline preview for images and PDFs; other files get a download card. */
function FilePreview({ asset, onDownload }: { asset: Asset; onDownload: () => void }) {
  const { data: url, isPending } = useFileUrl(asset);
  const mime = asset.mime_type ?? '';

  if (mime.startsWith('image/') || mime === 'application/pdf') {
    if (isPending || !url) {
      return (
        <div className="flex justify-center py-16">
          <Spinner label="Loading preview" />
        </div>
      );
    }
    return mime === 'application/pdf' ? (
      <iframe src={url} title={asset.title} className="h-[75vh] w-full rounded-card border border-border bg-white" />
    ) : (
      <img src={url} alt={asset.title} className="max-h-[75vh] max-w-full rounded-card border border-border object-contain" />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface px-6 py-12 text-center">
      <FileText className="size-8 text-muted" aria-hidden />
      <div>
        <p className="font-medium">{asset.file_name}</p>
        <p className="text-xs text-muted tabular-nums">
          {formatBytes(asset.file_size)}
          {asset.mime_type && ` · ${asset.mime_type}`}
        </p>
      </div>
      <Button variant="primary" icon={Download} onClick={onDownload}>
        Download
      </Button>
    </div>
  );
}

function AssetEditor({ asset, onDone }: { asset: Asset; onDone: () => void }) {
  const toast = useToast();
  const saveAsset = useSaveAsset();
  const hasFile = Boolean(asset.file_path);
  const form = useFormState(() => toAssetFormValues(asset), (values) => validateAsset(values, hasFile));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = form.check();
    if (!values) return;
    saveAsset.mutate(
      { id: asset.id, payload: toAssetPayload(values), file: values.file ?? undefined, previousPath: asset.file_path },
      {
        onSuccess: () => {
          toast.success('Changes saved.');
          onDone();
        },
        onError: (error) => toast.error(`Couldn't save changes. ${errorMessage(error)}`),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="rounded-card border border-border bg-surface p-5">
        <AssetFields
          id="asset-edit"
          values={form.values}
          errors={form.errors}
          onChange={form.changeMany}
          currentFileName={asset.file_name}
          splitEditor
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary" loading={saveAsset.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

/** /library/:assetId: read a document or preview a file; edit in place. */
export function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: assets, isPending, error, refetch } = useAssets();
  const deleteAsset = useDeleteAsset();
  const { copy, download } = useAssetActions();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isPending) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading" />
      </div>
    );
  }
  if (!assets) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load this item"
        description={error?.message}
        action={<Button onClick={() => void refetch()}>Try again</Button>}
      />
    );
  }

  const asset = assets.find((item) => item.id === assetId);
  if (!asset) {
    return (
      <EmptyState
        icon={SearchX}
        title="Not found"
        description="It may have been deleted."
        action={
          <Link to="/library" className="font-medium text-accent-blue hover:underline">
            Back to the library
          </Link>
        }
      />
    );
  }

  const meta = ASSET_TYPE_META[asset.type];
  const isFile = Boolean(asset.file_path);

  function handleDelete() {
    deleteAsset.mutate(asset!, {
      onSuccess: () => {
        toast.success(`${asset!.title} deleted.`);
        navigate('/library', { replace: true });
      },
      onError: (err) => toast.error(`Couldn't delete it. ${errorMessage(err)}`),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link to="/library" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-primary">
          <ArrowLeft className="size-4" aria-hidden />
          Library
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="min-w-0 text-xl">{asset.title}</h2>
              <Badge tone={meta.tone}>{meta.label}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span>Updated {formatRelative(asset.updated_at ?? asset.created_at)}</span>
              {asset.tags.map((tag) => (
                <Link key={tag} to={`/library?tags=${encodeURIComponent(tag)}`} className="hover:text-primary">
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
          {!editing && (
            <div className="flex flex-wrap gap-2">
              {isFile ? (
                <Button icon={Download} onClick={() => void download(asset)}>
                  Download
                </Button>
              ) : (
                <Button icon={Copy} onClick={() => void copy(asset)}>
                  Copy
                </Button>
              )}
              <Button icon={Pencil} onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(true)} className="hover:text-danger">
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <AssetEditor asset={asset} onDone={() => setEditing(false)} />
      ) : isFile ? (
        <FilePreview asset={asset} onDownload={() => void download(asset)} />
      ) : (
        <article className="max-w-3xl rounded-card border border-border bg-surface p-6">
          <MarkdownView>{asset.content ?? ''}</MarkdownView>
        </article>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this item?"
        description={`This permanently removes ${asset.title}${isFile ? ' and its file' : ''} for both of you. It can't be undone.`}
        footer={
          <>
            <Button onClick={() => setConfirmDelete(false)}>Keep it</Button>
            <Button variant="danger" icon={Trash2} loading={deleteAsset.isPending} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
