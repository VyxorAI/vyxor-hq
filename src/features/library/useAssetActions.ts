import { useToast } from '@/components/Toast';
import { errorMessage } from '@/lib/errors';
import { signedFileUrl } from './api';
import type { Asset } from './types';

/** Copy a document's text, or download a file through a short-lived private link. */
export function useAssetActions() {
  const toast = useToast();

  async function copy(asset: Asset) {
    try {
      await navigator.clipboard.writeText(asset.content ?? '');
      toast.success(`Copied "${asset.title}".`);
    } catch {
      toast.error("Couldn't copy. Your browser blocked clipboard access.");
    }
  }

  async function download(asset: Asset) {
    try {
      const url = await signedFileUrl(asset, { download: true });
      window.location.assign(url);
    } catch (error) {
      toast.error(`Couldn't download the file. ${errorMessage(error)}`);
    }
  }

  return { copy, download };
}
