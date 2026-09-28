import type { Asset, AssetKind, AssetPayload, AssetType } from '../types';

export interface AssetFormValues {
  kind: AssetKind;
  title: string;
  type: AssetType;
  tags: string[];
  content: string;
  /** A newly picked file (new upload or replacement). */
  file: File | null;
}

export type AssetFormErrors = Partial<Record<keyof AssetFormValues, string>>;

export function toAssetFormValues(asset: Asset | undefined, kind: AssetKind = 'document'): AssetFormValues {
  return {
    kind: asset ? (asset.file_path ? 'file' : 'document') : kind,
    title: asset?.title ?? '',
    type: asset?.type ?? (kind === 'document' ? 'sop' : 'proposal'),
    tags: asset?.tags ?? [],
    content: asset?.content ?? '',
    file: null,
  };
}

/** `hasFile`: editing an asset that already has a stored file. */
export function validateAsset(values: AssetFormValues, hasFile = false): AssetFormErrors {
  const errors: AssetFormErrors = {};
  if (!values.title.trim()) errors.title = 'Add a title.';
  if (values.kind === 'document' && !values.content.trim()) errors.content = 'Write something first.';
  if (values.kind === 'file' && !values.file && !hasFile) errors.file = 'Choose a file to upload.';
  return errors;
}

export function toAssetPayload(values: AssetFormValues): AssetPayload {
  return {
    title: values.title.trim(),
    type: values.type,
    tags: values.tags,
    // A file item keeps its file columns (set during upload); a document keeps its text
    content: values.kind === 'document' ? values.content : null,
  };
}

/** A title from a file name: "Dental-proposal_v2.pdf" -> "Dental proposal v2". */
export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}
