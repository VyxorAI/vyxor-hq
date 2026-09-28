import type { Enums, Tables, TablesInsert } from '@/lib/database.types';

export type Invoice = Tables<'invoices'>;
export type InvoiceType = Enums<'invoice_type'>;
export type InvoiceStatus = Enums<'invoice_status'>;
export type Expense = Tables<'expenses'>;
export type ExpenseCategory = Enums<'expense_category'>;

export type InvoicePayload = Omit<TablesInsert<'invoices'>, 'id' | 'created_at' | 'updated_at'>;
export type ExpensePayload = Omit<TablesInsert<'expenses'>, 'id' | 'created_at' | 'updated_at'>;
