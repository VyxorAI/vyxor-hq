import { useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SortableHeader } from '@/components/SortableHeader';
import { cn } from '@/lib/cn';
import { formatDate, formatZAR, todayISO } from '@/lib/format';
import { sortBy, toggleSort, type SortState, type SortValue } from '@/lib/sort';
import { INVOICE_STATUS_META, INVOICE_TYPE_LABELS } from '../constants';
import { displayStatus } from '../money';
import type { Invoice, InvoiceStatus } from '../types';

type SortKey = 'number' | 'client' | 'amount' | 'issued_on' | 'due_on' | 'status';
const STATUS_ORDER: InvoiceStatus[] = ['overdue', 'sent', 'draft', 'paid'];

interface InvoicesTableProps {
  invoices: Invoice[];
  clientNames: Map<string, string>;
  showClient?: boolean;
  onOpen: (id: string) => void;
  onSetStatus: (id: string, status: InvoiceStatus) => void;
  /** Id of the invoice whose quick action is in flight. */
  pendingId?: string;
}

export function InvoicesTable({ invoices, clientNames, showClient = true, onOpen, onSetStatus, pendingId }: InvoicesTableProps) {
  const [sort, setSort] = useState<SortState<SortKey>>({ key: 'issued_on', direction: 'desc' });
  const today = todayISO();

  const value = (invoice: Invoice): SortValue => {
    switch (sort.key) {
      case 'number':
        return invoice.number;
      case 'client':
        return clientNames.get(invoice.client_id)?.toLowerCase();
      case 'amount':
        return Number(invoice.amount);
      case 'issued_on':
        return invoice.issued_on;
      case 'due_on':
        return invoice.due_on;
      case 'status':
        return STATUS_ORDER.indexOf(displayStatus(invoice, today));
    }
  };
  const rows = sortBy(invoices, sort.direction, value, (a, b) => b.number.localeCompare(a.number));
  const headerProps = {
    sort,
    onSort: (key: SortKey) => setSort((current) => toggleSort(current, key, ['amount', 'issued_on', 'due_on'])),
  };

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <thead className="border-b border-border">
          <tr>
            <SortableHeader label="Number" sortKey="number" {...headerProps} />
            {showClient && <SortableHeader label="Client" sortKey="client" {...headerProps} />}
            <th scope="col" className="px-3 py-2.5 text-xs font-medium text-muted">Type</th>
            <SortableHeader label="Amount" sortKey="amount" align="right" {...headerProps} />
            <SortableHeader label="Issued" sortKey="issued_on" {...headerProps} />
            <SortableHeader label="Due" sortKey="due_on" {...headerProps} />
            <SortableHeader label="Status" sortKey="status" {...headerProps} />
            <th scope="col" className="px-3 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((invoice) => {
            const status = displayStatus(invoice, today);
            const meta = INVOICE_STATUS_META[status];
            return (
              <tr
                key={invoice.id}
                onClick={() => onOpen(invoice.id)}
                className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-raised"
              >
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(invoice.id);
                    }}
                    className="font-medium tabular-nums hover:text-accent-blue"
                  >
                    {invoice.number}
                  </button>
                </td>
                {showClient && (
                  <td className="max-w-56 truncate px-3 py-2.5">{clientNames.get(invoice.client_id) ?? 'Unknown client'}</td>
                )}
                <td className="px-3 py-2.5 text-muted">{INVOICE_TYPE_LABELS[invoice.type]}</td>
                <td className="px-3 py-2.5 text-right font-medium tabular-nums">{formatZAR(invoice.amount)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-muted tabular-nums">{formatDate(invoice.issued_on)}</td>
                <td
                  className={cn(
                    'px-3 py-2.5 whitespace-nowrap tabular-nums',
                    status === 'overdue' ? 'text-danger' : 'text-muted',
                  )}
                >
                  {formatDate(invoice.due_on)}
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </td>
                <td className="px-3 py-1.5 text-right whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
                  {invoice.status === 'draft' && (
                    <Button size="sm" loading={pendingId === invoice.id} onClick={() => onSetStatus(invoice.id, 'sent')}>
                      Mark as sent
                    </Button>
                  )}
                  {(status === 'sent' || status === 'overdue') && (
                    <Button size="sm" loading={pendingId === invoice.id} onClick={() => onSetStatus(invoice.id, 'paid')}>
                      Mark as paid
                    </Button>
                  )}
                  {invoice.paid_on && (
                    <span className="text-xs text-muted tabular-nums">Paid {formatDate(invoice.paid_on)}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
