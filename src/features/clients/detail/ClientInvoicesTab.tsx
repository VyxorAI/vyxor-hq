import { FileText, Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { StatTile } from '@/components/StatTile';
import { useToast } from '@/components/Toast';
import { useExpenses, useInvoices, useSetInvoiceStatus } from '@/features/money/api';
import { MoneyDrawerHost, useMoneyDrawerLinks } from '@/features/money/MoneyDrawerHost';
import { costToDate, isOutstanding, sumAmounts } from '@/features/money/money';
import { ExpensesTable } from '@/features/money/tables/ExpensesTable';
import { InvoicesTable } from '@/features/money/tables/InvoicesTable';
import type { InvoiceStatus } from '@/features/money/types';
import { errorMessage } from '@/lib/errors';
import { formatZAR } from '@/lib/format';
import type { Client } from '../types';

/** A client's invoices and costs, with lifetime totals. */
export function ClientInvoicesTab({ client }: { client: Client }) {
  const toast = useToast();
  const { data: allInvoices = [] } = useInvoices();
  const { data: allExpenses = [] } = useExpenses();
  const setStatus = useSetInvoiceStatus();
  const { openInvoice, openNewInvoice, openExpense, openNewExpense } = useMoneyDrawerLinks();

  const invoices = allInvoices.filter((invoice) => invoice.client_id === client.id);
  const expenses = allExpenses.filter((expense) => expense.client_id === client.id);
  const clientNames = new Map([[client.id, client.business_name]]);

  const billed = sumAmounts(invoices.filter((invoice) => invoice.status !== 'draft'));
  const paid = sumAmounts(invoices.filter((invoice) => invoice.status === 'paid'));
  const outstanding = sumAmounts(invoices.filter(isOutstanding));
  const costs = expenses.reduce((sum, expense) => sum + costToDate(expense), 0);

  function handleSetStatus(id: string, next: InvoiceStatus) {
    setStatus.mutate(
      { id, status: next },
      {
        onSuccess: () => toast.success(next === 'paid' ? 'Marked as paid.' : 'Marked as sent.'),
        onError: (error) => toast.error(`Couldn't update the invoice. ${errorMessage(error)}`),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Billed" value={formatZAR(billed)} hint="Sent and paid invoices" />
        <StatTile label="Paid" value={formatZAR(paid)} />
        <StatTile label="Outstanding" value={formatZAR(outstanding)} />
        <StatTile label="Costs to date" value={formatZAR(costs)} hint="Expenses linked to this client" />
        <StatTile
          label="Margin"
          value={formatZAR(paid - costs)}
          hint="Paid minus costs"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <section aria-labelledby="client-invoices" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 id="client-invoices" className="text-sm">Invoices</h3>
          <Button icon={Plus} onClick={openNewInvoice}>
            Add invoice
          </Button>
        </div>
        {invoices.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices for this client yet" />
        ) : (
          <InvoicesTable
            invoices={invoices}
            clientNames={clientNames}
            showClient={false}
            onOpen={openInvoice}
            onSetStatus={handleSetStatus}
            pendingId={setStatus.isPending ? setStatus.variables?.id : undefined}
          />
        )}
      </section>

      <section aria-labelledby="client-costs" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 id="client-costs" className="text-sm">Costs</h3>
          <Button icon={Plus} onClick={openNewExpense}>
            Add cost
          </Button>
        </div>
        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No costs linked to this client"
            description="Add costs like their WhatsApp number or API usage to see the margin."
          />
        ) : (
          <ExpensesTable expenses={expenses} clientNames={clientNames} showClient={false} onOpen={openExpense} />
        )}
      </section>

      <MoneyDrawerHost clientId={client.id} />
    </div>
  );
}
