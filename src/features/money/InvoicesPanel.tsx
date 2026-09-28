import { FileText, FilterX, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Select } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { useClients } from '@/features/clients/api';
import { errorMessage } from '@/lib/errors';
import { formatZAR, todayISO } from '@/lib/format';
import { oneOf, useUrlFilters } from '@/lib/useUrlFilters';
import { useSetInvoiceStatus } from './api';
import { INVOICE_STATUS_FILTER_OPTIONS, INVOICE_TYPE_LABELS, INVOICE_TYPE_OPTIONS } from './constants';
import { useMoneyDrawerLinks } from './MoneyDrawerHost';
import { displayStatus, sumAmounts } from './money';
import { RetainerDraftsButton } from './RetainerDraftsButton';
import { InvoicesTable } from './tables/InvoicesTable';
import type { Invoice, InvoiceStatus, InvoiceType } from './types';

const FILTER_KEYS = ['status', 'client', 'type'] as const;
const STATUSES = INVOICE_STATUS_FILTER_OPTIONS.map((option) => option.value);
const TYPES = Object.keys(INVOICE_TYPE_LABELS) as InvoiceType[];

export function InvoicesPanel({ invoices }: { invoices: Invoice[] }) {
  const toast = useToast();
  const { data: clients = [] } = useClients();
  const setStatus = useSetInvoiceStatus();
  const { openInvoice, openNewInvoice } = useMoneyDrawerLinks();
  const { values, setFilter, clearFilters, activeCount } = useUrlFilters(FILTER_KEYS);

  const clientNames = new Map(clients.map((client) => [client.id, client.business_name]));
  const status = oneOf(values.status, STATUSES);
  const type = oneOf(values.type, TYPES);
  const today = todayISO();
  const rows = invoices.filter(
    (invoice) =>
      (!status || displayStatus(invoice, today) === status) &&
      (!type || invoice.type === type) &&
      (!values.client || invoice.client_id === values.client),
  );

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Filter by status"
          placeholder="All statuses"
          options={INVOICE_STATUS_FILTER_OPTIONS}
          value={status}
          onChange={(event) => setFilter('status', event.target.value)}
          className="w-[calc(50%-4px)] sm:w-40"
        />
        <Select
          aria-label="Filter by type"
          placeholder="All types"
          options={INVOICE_TYPE_OPTIONS}
          value={type}
          onChange={(event) => setFilter('type', event.target.value)}
          className="w-[calc(50%-4px)] sm:w-36"
        />
        <Select
          aria-label="Filter by client"
          placeholder="All clients"
          options={clients.map((client) => ({ value: client.id, label: client.business_name }))}
          value={values.client}
          onChange={(event) => setFilter('client', event.target.value)}
          className="w-full sm:w-48"
        />
        {activeCount > 0 && (
          <Button variant="ghost" icon={FilterX} onClick={clearFilters}>
            Clear
          </Button>
        )}
        <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
          <RetainerDraftsButton />
          <Button icon={Plus} onClick={openNewInvoice}>
            Add invoice
          </Button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Add one, or draft this month's retainer invoices for all active clients."
          action={
            <Button variant="primary" icon={Plus} onClick={openNewInvoice}>
              Add invoice
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FilterX}
          title="No invoices match these filters"
          action={<Button onClick={clearFilters}>Clear filters</Button>}
        />
      ) : (
        <>
          <InvoicesTable
            invoices={rows}
            clientNames={clientNames}
            onOpen={openInvoice}
            onSetStatus={handleSetStatus}
            pendingId={setStatus.isPending ? setStatus.variables?.id : undefined}
          />
          <p className="text-xs text-muted tabular-nums">
            {rows.length} {rows.length === 1 ? 'invoice' : 'invoices'} · {formatZAR(sumAmounts(rows))}
          </p>
        </>
      )}
    </div>
  );
}
