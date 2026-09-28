import type { Enums, Tables } from '@/lib/database.types';

export type Activity = Tables<'activities'>;
export type ActivityEntity = Enums<'activity_entity'>;
export type ActivityKind = Enums<'activity_kind'>;

/** Kinds a founder logs by hand; the other two are written by the database. */
export type ManualKind = Extract<ActivityKind, 'note' | 'call' | 'email'>;

export interface ChangeMeta {
  field: string;
  from: string | null;
  to: string | null;
}
