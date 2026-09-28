import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { StatTile } from '@/components/StatTile';
import { Tabs, type TabItem } from '@/components/Tabs';
import { useClients } from '@/features/clients/api';
import { monthlyRecurring } from '@/features/clients/table/filters';
import { formatZAR } from '@/lib/format';
import { oneOf } from '@/lib/useUrlFilters';
import { useUpdateParams } from '@/lib/useUpdateParams';
import { useExpenses, useInvoices } from './api';
import { RevenueCard } from './chart/RevenueCard';
import { ExpensesPanel } from './ExpensesPanel';
import { InvoicesPanel } from './InvoicesPanel';
import { MoneyDrawerHost } from './MoneyDrawerHost';
import { monthlySeries, summarise } from './money';

type MoneyTab = 'invoices' | 'expenses';
const TABS: ReadonlyArray<TabItem<MoneyTab>> = [
  { value: 'invoices', label: 'Invoices' },
  { value: 'expenses', label: 'Expenses' },
];

/** /money. URL state: `tab`, table filters, and the invoice/expense drawers. */
export function MoneyPage() {
  const [params, updateParams] = useUpdateParams();
  const { data: clients = [] } = useClients();
  const invoicesQuery = useInvoices();
  const expensesQuery = useExpenses();

  const tab = oneOf(params.get('tab'), ['invoices', 'expenses'] as const) || 'invoices';
  const setTab = (next: MoneyTab) =>
    updateParams((p) => {
      // Filters belong to one table; start the other one clean
      ['status', 'client', 'type', 'category', 'repeats'].forEach((key) => p.delete(key));
      if (next === 'invoices') p.delete('tab');
      else p.set('tab', next);
    }, true);

  if (invoicesQuery.isPending || expensesQuery.isPending) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading money" />
      </div>
    );
  }
  if (!invoicesQuery.data || !expensesQuery.data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load invoices and expenses"
        description={(invoicesQuery.error ?? expensesQuery.error)?.message}
        action={
          <Button
            onClick={() => {
              void invoicesQuery.refetch();
              void expensesQuery.refetch();
            }}
          >
            Try again
          </Button>
        }
      />
    );
  }

  const invoices = invoicesQuery.data;
  const expenses = expensesQuery.data;
  const summary = summarise(invoices, expenses);
  const activeClients = clients.filter((client) => client.status === 'active').length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          label="MRR"
          value={formatZAR(monthlyRecurring(clients))}
          hint={`${activeClients} active ${activeClients === 1 ? 'client' : 'clients'}`}
        />
        <StatTile label="Setup fees this month" value={formatZAR(summary.setupThisMonth)} hint="Paid this month" />
        <StatTile
          label="Outstanding"
          value={formatZAR(summary.outstanding)}
          hint={
            <>
              {summary.outstandingCount} {summary.outstandingCount === 1 ? 'invoice' : 'invoices'}
              {summary.overdueCount > 0 && <span className="text-danger"> · {summary.overdueCount} overdue</span>}
            </>
          }
        />
        <StatTile label="Expenses this month" value={formatZAR(summary.expensesThisMonth)} hint="Including monthly costs" />
        <StatTile
          label="Profit this month"
          value={formatZAR(summary.profitThisMonth)}
          hint={`${formatZAR(summary.revenueThisMonth)} paid in`}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <RevenueCard data={monthlySeries(invoices, expenses)} />

      <div className="flex flex-col gap-4">
        <Tabs label="Money sections" items={TABS} value={tab} onChange={setTab} idPrefix="money" />
        <div id="money-panel" role="tabpanel" aria-labelledby={`money-tab-${tab}`}>
          {tab === 'invoices' ? <InvoicesPanel invoices={invoices} /> : <ExpensesPanel expenses={expenses} />}
        </div>
      </div>

      <MoneyDrawerHost />
    </div>
  );
}
