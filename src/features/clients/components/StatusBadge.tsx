import { Badge } from '@/components/Badge';
import { STATUS_META } from '../constants';
import type { ClientStatus } from '../types';

export function StatusBadge({ status }: { status: ClientStatus }) {
  const meta = STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
