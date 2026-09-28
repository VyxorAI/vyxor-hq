import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@/lib/database.types';
import { applyMove } from './ordering';
import type { Lead, LeadInsert, LeadMove } from './types';

export const leadKeys = {
  all: ['leads'] as const,
};

export function useLeads() {
  return useQuery({
    queryKey: leadKeys.all,
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: LeadInsert): Promise<Lead> => {
      const { data, error } = await supabase.from('leads').insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: TablesUpdate<'leads'> }): Promise<Lead> => {
      const { data, error } = await supabase.from('leads').update(changes).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  });
}

interface MoveVariables {
  move: LeadMove;
  previous: Lead[] | undefined;
}

/**
 * Move a lead on the board. The cache is updated synchronously so the card
 * never snaps back, then rolled back if the server rejects the move.
 */
export function useMoveLead() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { mutate } = useMutation({
    mutationFn: async ({ move }: MoveVariables) => {
      if (move.lostReason !== undefined) {
        const { error } = await supabase.from('leads').update({ lost_reason: move.lostReason }).eq('id', move.id);
        if (error) throw error;
      }
      const { error } = await supabase.rpc('move_lead', {
        p_lead_id: move.id,
        p_stage: move.stage,
        p_index: move.index,
      });
      if (error) throw error;
    },
    onError: (_error, { previous }) => {
      if (previous) queryClient.setQueryData(leadKeys.all, previous);
      toast.error("Couldn't move that lead. It's back where it was.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  });

  return useCallback(
    (move: LeadMove) => {
      const previous = queryClient.getQueryData<Lead[]>(leadKeys.all);
      void queryClient.cancelQueries({ queryKey: leadKeys.all });
      if (previous) queryClient.setQueryData(leadKeys.all, applyMove(previous, move));
      mutate({ move, previous });
    },
    [queryClient, mutate],
  );
}
