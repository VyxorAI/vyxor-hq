import { Badge } from '@/components/Badge';
import { PRIORITY_META } from '../constants';
import type { TaskPriority } from '../types';

/** Only high and low get a badge; medium is the quiet default. */
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === 'medium') return null;
  const meta = PRIORITY_META[priority];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
