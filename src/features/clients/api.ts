import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leadKeys } from '@/features/leads/api';
import { applyMove } from '@/features/leads/ordering';
import type { Lead } from '@/features/leads/types';
import type { Json } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import type { Client, ClientPayload } from './types';

export const clientKeys = {
  all: ['clients'] as const,
};

export function useClients() {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase.from('clients').select('*').order('business_name');
      if (error) throw error;
      return data;
    },
  });
}

/** Clients indexed by the lead they came from. */
export function useClientsByLead(): Map<string, Client> {
  const { data } = useClients();
  return useMemo(
    () => new Map((data ?? []).filter((client) => client.lead_id).map((client) => [client.lead_id as string, client])),
    [data],
  );
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (client: ClientPayload): Promise<Client> => {
      const { data, error } = await supabase.from('clients').insert(client).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: ClientPayload }): Promise<Client> => {
      const { data, error } = await supabase.from('clients').update(changes).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      // The client's projects and tasks are deleted with it
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      return queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

interface ConvertVariables {
  leadId: string;
  client: ClientPayload;
  /** Where the lead lands in the Won column (board drops). Omit to put it at the bottom. */
  index?: number;
}

/** Create a client from a lead and mark the lead as won, in one transaction. Returns the client id. */
export function useConvertLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, client, index }: ConvertVariables): Promise<string> => {
      const { data, error } = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: leadId,
        p_client: client as Json,
        ...(index === undefined ? {} : { p_index: index }),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (_clientId, { leadId, index }) => {
      // Place the card in Won straight away so the board doesn't flicker before the refetch
      const leads = queryClient.getQueryData<Lead[]>(leadKeys.all);
      if (leads && index !== undefined) {
        queryClient.setQueryData(leadKeys.all, applyMove(leads, { id: leadId, stage: 'won', index }));
      }
      void queryClient.invalidateQueries({ queryKey: leadKeys.all });
      // Awaited so the new client is in the cache before the caller navigates to its page
      await queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}
