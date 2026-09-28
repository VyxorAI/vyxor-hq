import type { Enums, Tables, TablesInsert } from '@/lib/database.types';

export type Project = Tables<'projects'>;
export type ProjectType = Enums<'project_type'>;
export type ProjectStatus = Enums<'project_status'>;

/** Project fields the app edits. */
export type ProjectPayload = Omit<TablesInsert<'projects'>, 'id' | 'created_at' | 'updated_at'>;
