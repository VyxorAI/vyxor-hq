import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { leadKeys } from '@/features/leads/api';
import { addDaysISO, todayISO } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { LeadIndustry } from '@/features/leads/types';
import type { ContactChannel, Prospect, ProspectSearch, ProspectTab } from './types';

export const prospectKeys = {
  all: ['prospects'] as const,
  list: (tab: ProspectTab) => ['prospects', 'list', tab] as const,
  stats: ['prospects', 'stats'] as const,
  searches: ['prospect-searches'] as const,
};

/** One tab of prospects, best first. */
export function useProspects(tab: ProspectTab) {
  return useQuery({
    queryKey: prospectKeys.list(tab),
    queryFn: async (): Promise<Prospect[]> => {
      let query = supabase.from('prospects').select('*');
      if (tab === 'dnc') query = query.eq('do_not_contact', true);
      else query = query.eq('status', tab).eq('do_not_contact', false);
      const ordered =
        tab === 'converted'
          ? query.order('contacted_at', { ascending: false })
          : query.order('score', { ascending: false }).order('created_at', { ascending: false });
      const { data, error } = await ordered.limit(1000);
      if (error) throw error;
      return data;
    },
  });
}

/** Local midnight today / Monday this week, as ISO timestamps. */
function periodStarts() {
  const today = todayISO();
  const offset = (new Date().getDay() + 6) % 7;
  const toTimestamp = (day: string) => new Date(`${day}T00:00:00`).toISOString();
  return { today: toTimestamp(today), week: toTimestamp(addDaysISO(today, -offset)) };
}

export interface ProspectStats {
  toContact: number;
  newToday: number;
  movedThisWeek: number;
  convertedLeadIds: string[];
}

export function useProspectStats() {
  return useQuery({
    queryKey: prospectKeys.stats,
    queryFn: async (): Promise<ProspectStats> => {
      const { today, week } = periodStarts();
      const head = { count: 'exact' as const, head: true };
      const [toContact, newToday, movedThisWeek, converted] = await Promise.all([
        supabase.from('prospects').select('id', head).eq('status', 'new').eq('do_not_contact', false),
        supabase.from('prospects').select('id', head).gte('created_at', today),
        supabase.from('prospects').select('id', head).eq('status', 'converted').gte('contacted_at', week),
        supabase.from('prospects').select('lead_id').eq('status', 'converted').not('lead_id', 'is', null),
      ]);
      const error = toContact.error ?? newToday.error ?? movedThisWeek.error ?? converted.error;
      if (error) throw error;
      return {
        toContact: toContact.count ?? 0,
        newToday: newToday.count ?? 0,
        movedThisWeek: movedThisWeek.count ?? 0,
        convertedLeadIds: (converted.data ?? []).map((row) => row.lead_id as string),
      };
    },
  });
}

interface ConvertInput {
  prospectId: string;
  channel: ContactChannel;
  note?: string;
  followUp?: string;
}

/** "Contacted -> Leads": creates the lead, logs the first contact, marks the prospect. Returns the lead id. */
export function useConvertProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ prospectId, channel, note, followUp }: ConvertInput): Promise<string> => {
      const { data, error } = await supabase.rpc('convert_prospect_to_lead', {
        p_prospect_id: prospectId,
        p_channel: channel,
        ...(note ? { p_note: note } : {}),
        ...(followUp ? { p_follow_up: followUp } : {}),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leadKeys.all });
      return queryClient.invalidateQueries({ queryKey: prospectKeys.all });
    },
  });
}

/** Not a fit / do not contact / restore. */
export function useUpdateProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: { status?: Prospect['status']; do_not_contact?: boolean } }) => {
      const { error } = await supabase.from('prospects').update(changes).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prospectKeys.all }),
  });
}

export interface RunResult {
  searchesRun: number;
  searchesLeftToday: number;
  added: number;
  refreshed: number;
  websitesChecked: number;
  errors: string[];
}

/** Run the search now (shares the daily limit with the 06:00 run). */
export function useRunProspectSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<RunResult> => {
      const { data, error } = await supabase.functions.invoke<RunResult>('find-prospects', { body: { trigger: 'manual' } });
      if (error) {
        // Surface the function's own message ("GOOGLE_PLACES_API_KEY is not set…") instead of a generic one
        if (error instanceof FunctionsHttpError) {
          const body = (await error.context.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? error.message);
        }
        throw error;
      }
      return data as RunResult;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: prospectKeys.searches });
      return queryClient.invalidateQueries({ queryKey: prospectKeys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Searches (what to look for, and where)
// ---------------------------------------------------------------------------

export function useProspectSearches() {
  return useQuery({
    queryKey: prospectKeys.searches,
    queryFn: async (): Promise<ProspectSearch[]> => {
      const { data, error } = await supabase.from('prospect_searches').select('*').order('category').order('area');
      if (error) throw error;
      return data;
    },
  });
}

export function useSetSearchesActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, active }: { ids: string[]; active: boolean }) => {
      const { error } = await supabase.from('prospect_searches').update({ active }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prospectKeys.searches }),
  });
}

export interface NewSearches {
  category: string;
  query: string;
  industry: LeadIndustry;
  areas: string[];
}

/** One search row per area; existing query + area pairs are left as they are. */
export function useAddSearches() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ category, query, industry, areas }: NewSearches) => {
      const rows = areas.map((area) => ({ category: category.trim(), query: query.trim(), area: area.trim(), industry }));
      const { error } = await supabase
        .from('prospect_searches')
        .upsert(rows, { onConflict: 'query,area', ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prospectKeys.searches }),
  });
}
