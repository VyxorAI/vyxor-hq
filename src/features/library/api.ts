import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MAX_FILE_BYTES, STORAGE_BUCKET } from './constants';
import type { Asset, AssetPayload } from './types';

export const assetKeys = {
  all: ['assets'] as const,
};

export function useAssets() {
  return useQuery({
    queryKey: assetKeys.all,
    queryFn: async (): Promise<Asset[]> => {
      const { data, error } = await supabase.from('assets').select('*').order('title');
      if (error) throw error;
      return data;
    },
  });
}

/** Storage-safe file name: keeps letters, numbers, dots, dashes and underscores. */
function safeName(name: string): string {
  return name.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(-120) || 'file';
}

export interface UploadedFile {
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
}

async function uploadFile(file: File): Promise<UploadedFile> {
  if (file.size > MAX_FILE_BYTES) throw new Error('Files can be up to 25 MB.');
  const path = `${crypto.randomUUID()}/${safeName(file.name)}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return { file_path: path, file_name: file.name, file_size: file.size, mime_type: file.type || null };
}

async function removeFile(path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(STORAGE_BUCKET).remove([path]);
}

interface SaveAssetInput {
  id?: string;
  payload: AssetPayload;
  /** A new or replacement file to upload first. */
  file?: File;
  /** The file being replaced, removed after a successful save. */
  previousPath?: string | null;
}

/** Create or update an asset, uploading its file first when there is one. */
export function useSaveAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload, file, previousPath }: SaveAssetInput): Promise<Asset> => {
      const uploaded = file ? await uploadFile(file) : null;
      const row = uploaded ? { ...payload, ...uploaded } : payload;
      const query = id ? supabase.from('assets').update(row).eq('id', id) : supabase.from('assets').insert(row);
      const { data, error } = await query.select().single();
      if (error) {
        // Don't leave an orphaned upload behind
        await removeFile(uploaded?.file_path);
        throw error;
      }
      if (uploaded && previousPath) await removeFile(previousPath);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (asset: Asset) => {
      const { error } = await supabase.from('assets').delete().eq('id', asset.id);
      if (error) throw error;
      await removeFile(asset.file_path);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

/** Short-lived private link. `download` makes the browser save it under the original name. */
export async function signedFileUrl(asset: Pick<Asset, 'file_path' | 'file_name'>, options: { download?: boolean } = {}) {
  if (!asset.file_path) throw new Error('This item has no file.');
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(asset.file_path, 300, options.download ? { download: asset.file_name ?? true } : undefined);
  if (error) throw error;
  return data.signedUrl;
}

/** Signed URL for previews (images, PDFs) on the detail page. Refreshed before it expires. */
export function useFileUrl(asset: Pick<Asset, 'id' | 'file_path' | 'file_name'> | undefined) {
  return useQuery({
    queryKey: ['asset-file-url', asset?.id, asset?.file_path],
    enabled: Boolean(asset?.file_path),
    queryFn: () => signedFileUrl(asset!),
    staleTime: 4 * 60_000,
    refetchInterval: 4 * 60_000,
  });
}
