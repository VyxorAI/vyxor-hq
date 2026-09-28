import type { BadgeTone } from '@/components/Badge';
import type { SelectOption } from '@/components/Input';
import { toOptions } from '@/lib/labels';
import type { ProjectStatus, ProjectType } from './types';

export interface ProjectStatusMeta {
  value: ProjectStatus;
  label: string;
  tone: BadgeTone;
  dot: string;
}

export const PROJECT_STATUSES: readonly ProjectStatusMeta[] = [
  { value: 'planning', label: 'Planning', tone: 'neutral', dot: 'bg-muted' },
  { value: 'building', label: 'Building', tone: 'blue', dot: 'bg-accent-blue' },
  { value: 'review', label: 'Review', tone: 'purple', dot: 'bg-accent-purple' },
  { value: 'live', label: 'Live', tone: 'teal', dot: 'bg-accent-teal' },
  { value: 'on_hold', label: 'On hold', tone: 'warning', dot: 'bg-warning' },
];

export const PROJECT_STATUS_META = Object.fromEntries(PROJECT_STATUSES.map((status) => [status.value, status])) as Record<
  ProjectStatus,
  ProjectStatusMeta
>;

export const PROJECT_STATUS_OPTIONS: SelectOption<ProjectStatus>[] = PROJECT_STATUSES.map(({ value, label }) => ({
  value,
  label,
}));

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  whatsapp_agent: 'WhatsApp agent',
  website: 'Website',
  voice_agent: 'Voice agent',
  automation: 'Automation',
  other: 'Other',
};

export const PROJECT_TYPE_OPTIONS = toOptions(PROJECT_TYPE_LABELS);
