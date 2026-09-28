import { useState } from 'react';
import { Badge } from '@/components/Badge';
import { SortableHeader } from '@/components/SortableHeader';
import { formatDate, formatZAR } from '@/lib/format';
import { sortBy, toggleSort, type SortState, type SortValue } from '@/lib/sort';
import { EXPENSE_CATEGORY_LABELS } from '../constants';
import { currentMonth, expenseCountsIn } from '../money';
import type { Expense } from '../types';

type SortKey = 'description' | 'category' | 'client' | 'amount' | 'date';

interface ExpensesTableProps {
  expenses: Expense[];
  clientNames: Map<string, string>;
  showClient?: boolean;
  onOpen: (id: string) => void;
}

function RecurringLabel({ expense }: { expense: Expense }) {
  if (!expense.recurring) return <span className="text-muted">Once-off</span>;
  const running = expenseCountsIn(expense, currentMonth());
  return (
    <span className="flex items-center gap-2">
      <Badge tone={running ? 'blue' : 'neutral'}>Monthly</Badge>
      <span className="text-xs text-muted">
        {expense.ends_on ? `${running ? 'until' : 'ended'} ${formatDate(expense.ends_on)}` : 'ongoing'}
      </span>
    </span>
  );
}

export function ExpensesTable({ expenses, clientNames, showClient = true, onOpen }: ExpensesTableProps) {
  const [sort, setSort] = useState<SortState<SortKey>>({ key: 'date', direction: 'desc' });

  const value = (expense: Expense): SortValue => {
    switch (sort.key) {
      case 'description':
        return expense.description.toLowerCase();
      case 'category':
        return EXPENSE_CATEGORY_LABELS[expense.category];
      case 'client':
        return expense.client_id ? clientNames.get(expense.client_id)?.toLowerCase() : null;
      case 'amount':
        return Number(expense.amount);
      case 'date':
        return expense.date;
    }
  };
  const rows = sortBy(expenses, sort.direction, value, (a, b) => a.description.localeCompare(b.description));
  const headerProps = {
    sort,
    onSort: (key: SortKey) => setSort((current) => toggleSort(current, key, ['amount', 'date'])),
  };

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="border-b border-border">
          <tr>
            <SortableHeader label="Description" sortKey="description" {...headerProps} />
            <SortableHeader label="Category" sortKey="category" {...headerProps} />
            {showClient && <SortableHeader label="Client" sortKey="client" {...headerProps} />}
            <SortableHeader label="Amount" sortKey="amount" align="right" {...headerProps} />
            <SortableHeader label="Date" sortKey="date" {...headerProps} />
            <th scope="col" className="px-3 py-2.5 text-xs font-medium text-muted">Repeats</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((expense) => (
            <tr
              key={expense.id}
              onClick={() => onOpen(expense.id)}
              className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-raised"
            >
              <td className="max-w-64 px-3 py-2.5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(expense.id);
                  }}
                  className="block max-w-full truncate text-left font-medium hover:text-accent-blue"
                >
                  {expense.description}
                </button>
              </td>
              <td className="px-3 py-2.5 text-muted">{EXPENSE_CATEGORY_LABELS[expense.category]}</td>
              {showClient && (
                <td className="max-w-48 truncate px-3 py-2.5 text-muted">
                  {expense.client_id ? (clientNames.get(expense.client_id) ?? 'Unknown client') : 'Agency-wide'}
                </td>
              )}
              <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                {formatZAR(expense.amount)}
                {expense.recurring && <span className="text-xs font-normal text-muted">/mo</span>}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap text-muted tabular-nums">{formatDate(expense.date)}</td>
              <td className="px-3 py-2.5">
                <RecurringLabel expense={expense} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
