import { DueDate } from '@/components/DueDate';
import { OPEN_STAGES } from '../constants';
import type { LeadStage } from '../types';

/** Next follow-up: amber when due today, red when overdue (open leads only). */
export function FollowUpDate({ date, stage }: { date: string | null; stage: LeadStage }) {
  return <DueDate date={date} highlight={OPEN_STAGES.includes(stage)} label="Follow up" />;
}
