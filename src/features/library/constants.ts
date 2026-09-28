import {
  BookOpen,
  ClipboardList,
  FileSignature,
  FileText,
  LayoutTemplate,
  ListChecks,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { BadgeTone } from '@/components/Badge';
import { toOptions } from '@/lib/labels';
import type { AssetType } from './types';

export const ASSET_TYPE_META: Record<AssetType, { label: string; tone: BadgeTone; icon: LucideIcon }> = {
  sop: { label: 'SOP', tone: 'blue', icon: ListChecks },
  prompt: { label: 'Prompt', tone: 'purple', icon: Sparkles },
  proposal: { label: 'Proposal', tone: 'teal', icon: FileSignature },
  template: { label: 'Template', tone: 'neutral', icon: LayoutTemplate },
  questionnaire: { label: 'Questionnaire', tone: 'neutral', icon: ClipboardList },
  guide: { label: 'Guide', tone: 'neutral', icon: BookOpen },
  other: { label: 'Other', tone: 'neutral', icon: FileText },
};

export const ASSET_TYPE_OPTIONS = toOptions(
  Object.fromEntries(Object.entries(ASSET_TYPE_META).map(([key, meta]) => [key, meta.label])) as Record<AssetType, string>,
);

/** Matches the bucket limit in the migration. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export const STORAGE_BUCKET = 'assets';
