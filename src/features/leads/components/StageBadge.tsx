import { Badge } from '@/components/Badge';
import { STAGE_META } from '../constants';
import type { LeadStage } from '../types';

export function StageBadge({ stage }: { stage: LeadStage }) {
  const meta = STAGE_META[stage];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
