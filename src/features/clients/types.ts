import type { Enums, Tables, TablesInsert } from '@/lib/database.types';

export type Client = Tables<'clients'>;
export type ClientInsert = TablesInsert<'clients'>;
export type ClientStatus = Enums<'client_status'>;

/** Client fields the app edits (everything except ids and timestamps). */
export type ClientPayload = Omit<ClientInsert, 'id' | 'created_at' | 'updated_at' | 'lead_id'>;
