import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { applyTaskMove } from './ordering';
import type { Task, TaskMove, TaskPayload, TaskStatus } from './types';

export const taskKeys = {
  all: ['tasks'] as const,
};

/** All tasks. Boards, My week and client tabs filter this list (two founders' worth of data). */
export function useTasks() {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: TaskPayload): Promise<Task> => {
      const { data, error } = await supabase.from('tasks').insert(task).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<TaskPayload> }): Promise<Task> => {
      const { data, error } = await supabase.from('tasks').update(changes).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

interface MoveVariables {
  move: TaskMove;
  previous: Task[] | undefined;
}

/** Move a task on a board. Updates the cache straight away and rolls back on failure. */
export function useMoveTask() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { mutate } = useMutation({
    mutationFn: async ({ move }: MoveVariables) => {
      const { error } = await supabase.rpc('move_task', {
        p_task_id: move.id,
        p_status: move.status,
        p_index: move.index,
      });
      if (error) throw error;
    },
    onError: (_error, { previous }) => {
      if (previous) queryClient.setQueryData(taskKeys.all, previous);
      toast.error("Couldn't move that task. It's back where it was.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });

  return useCallback(
    (move: TaskMove) => {
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);
      void queryClient.cancelQueries({ queryKey: taskKeys.all });
      if (previous) queryClient.setQueryData(taskKeys.all, applyTaskMove(previous, move));
      mutate({ move, previous });
    },
    [queryClient, mutate],
  );
}

/** Tick a task done (or back to to-do) from a list, with an instant checkbox. */
export function useSetTaskStatus() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { mutate } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus; previous: Task[] | undefined }) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onError: (_error, { previous }) => {
      if (previous) queryClient.setQueryData(taskKeys.all, previous);
      toast.error("Couldn't update that task.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });

  return useCallback(
    (id: string, status: TaskStatus) => {
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);
      void queryClient.cancelQueries({ queryKey: taskKeys.all });
      if (previous) {
        queryClient.setQueryData(
          taskKeys.all,
          previous.map((task) => (task.id === id ? { ...task, status } : task)),
        );
      }
      mutate({ id, status, previous });
    },
    [queryClient, mutate],
  );
}
