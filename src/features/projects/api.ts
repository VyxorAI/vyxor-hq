import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Project, ProjectPayload } from './types';

export const projectKeys = {
  all: ['projects'] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase.from('projects').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useProjectMap(): Map<string, Project> {
  const { data } = useProjects();
  return useMemo(() => new Map((data ?? []).map((project) => [project.id, project])), [data]);
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (project: ProjectPayload): Promise<Project> => {
      const { data, error } = await supabase.from('projects').insert(project).select().single();
      if (error) throw error;
      return data;
    },
    // Awaited so the project is cached before the caller opens its page
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: ProjectPayload }): Promise<Project> => {
      const { data, error } = await supabase.from('projects').update(changes).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // A project moved to another client takes its tasks along
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      return queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      return queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
