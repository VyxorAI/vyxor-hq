import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Expense, ExpensePayload, Invoice, InvoicePayload, InvoiceStatus } from './types';

export const invoiceKeys = { all: ['invoices'] as const };
export const expenseKeys = { all: ['expenses'] as const };

export function useInvoices() {
  return useQuery({
    queryKey: invoiceKeys.all,
    queryFn: async (): Promise<Invoice[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('issued_on', { ascending: false })
        .order('number', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: expenseKeys.all,
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: InvoicePayload }): Promise<Invoice> => {
      const query = id
        ? supabase.from('invoices').update(payload).eq('id', id)
        : supabase.from('invoices').insert(payload);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
}

/** Quick status change from a table row ("Mark as sent", "Mark as paid"). */
export function useSetInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
}

/** Insert several invoices at once (this month's retainer drafts). */
export function useCreateInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoices: InvoicePayload[]) => {
      const { error } = await supabase.from('invoices').insert(invoices);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
}

export function useSaveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: ExpensePayload }): Promise<Expense> => {
      const query = id
        ? supabase.from('expenses').update(payload).eq('id', id)
        : supabase.from('expenses').insert(payload);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}
