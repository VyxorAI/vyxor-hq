import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';
import { useAuth } from './useAuth';

export type Profile = Tables<'profiles'>;

export const profileKeys = {
  all: ['profiles'] as const,
};

export function useProfiles() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

/** Profiles indexed by id, for looking up lead owners. */
export function useProfileMap(): Map<string, Profile> {
  const { data } = useProfiles();
  return useMemo(() => new Map((data ?? []).map((profile) => [profile.id, profile])), [data]);
}

/** The logged-in founder's profile (undefined until loaded). */
export function useCurrentProfile(): Profile | undefined {
  const { user } = useAuth();
  const { data } = useProfiles();
  return data?.find((profile) => profile.user_id === user?.id);
}
