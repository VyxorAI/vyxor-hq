import { useCallback } from 'react';
import { useUpdateParams } from '@/lib/useUpdateParams';
import { useExpenses, useInvoices } from './api';
import { ExpenseDrawer } from './ExpenseDrawer';
import { InvoiceDrawer } from './InvoiceDrawer';

const DRAWER_KEYS = ['invoice', 'newInvoice', 'expense', 'newExpense'] as const;

/** Open invoice/expense drawers through the URL so links and "+ New" work. */
export function useMoneyDrawerLinks() {
  const [, updateParams] = useUpdateParams();
  const open = useCallback(
    (key: (typeof DRAWER_KEYS)[number], value: string) =>
      updateParams((p) => {
        DRAWER_KEYS.forEach((k) => p.delete(k));
        p.set(key, value);
      }),
    [updateParams],
  );
  return {
    openInvoice: (id: string) => open('invoice', id),
    openNewInvoice: () => open('newInvoice', '1'),
    openExpense: (id: string) => open('expense', id),
    openNewExpense: () => open('newExpense', '1'),
  };
}

/** Renders whichever money drawer the URL asks for. `clientId` pre-selects the client for new records. */
export function MoneyDrawerHost({ clientId }: { clientId?: string }) {
  const [params, updateParams] = useUpdateParams();
  const { data: invoices } = useInvoices();
  const { data: expenses } = useExpenses();

  const close = () => updateParams((p) => DRAWER_KEYS.forEach((k) => p.delete(k)), true);

  const invoiceId = params.get('invoice');
  const expenseId = params.get('expense');
  const invoice = invoiceId ? invoices?.find((item) => item.id === invoiceId) : undefined;
  const expense = expenseId ? expenses?.find((item) => item.id === expenseId) : undefined;
  const defaultClientId = clientId ?? params.get('client') ?? undefined;

  if (params.get('newInvoice') === '1') {
    return <InvoiceDrawer key="new-invoice" invoice={undefined} defaultClientId={defaultClientId} onClose={close} />;
  }
  if (params.get('newExpense') === '1') {
    return <ExpenseDrawer key="new-expense" expense={undefined} defaultClientId={clientId} onClose={close} />;
  }
  if (invoice) return <InvoiceDrawer key={invoice.id} invoice={invoice} onClose={close} />;
  if (expense) return <ExpenseDrawer key={expense.id} expense={expense} onClose={close} />;
  return null;
}
