import type { Enums, Tables, TablesInsert } from '@/lib/database.types';

export type Asset = Tables<'assets'>;
export type AssetType = Enums<'asset_type'>;
export type AssetPayload = Omit<TablesInsert<'assets'>, 'id' | 'created_at' | 'updated_at'>;

/** An asset is either an uploaded file or a written (markdown) document. */
export type AssetKind = 'file' | 'document';

export function assetKind(asset: Pick<Asset, 'file_path'>): AssetKind {
  return asset.file_path ? 'file' : 'document';
}
