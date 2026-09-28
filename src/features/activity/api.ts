import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Activity, ActivityEntity, ManualKind } from './types';

export const activityKeys = {
  all: ['activities'] as const,
  forEntities: (ids: string[]) => ['activities', 'entities', ...ids] as const,
  recent: ['activities', 'recent'] as const,
};

/** Activity for one or more records (e.g. a client plus the lead it came from), newest first. */
export function useActivities(entityIds: string[]) {
  return useQuery({
    queryKey: activityKeys.forEntities(entityIds),
    enabled: entityIds.length > 0,
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .in('entity_id', entityIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Latest activity across everything, for the home screen. */
export function useRecentActivities(limit = 15) {
  return useQuery({
    queryKey: activityKeys.recent,
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

interface NewActivity {
  entity_type: ActivityEntity;
  entity_id: string;
  kind: ManualKind;
  body: string;
}

export function useAddActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activity: NewActivity) => {
      // user_id defaults to the signed-in founder in the database
      const { error } = await supabase.from('activities').insert(activity);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activityKeys.all }),
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activityKeys.all }),
  });
}
