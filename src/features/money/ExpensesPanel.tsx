import { FilterX, Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Select } from '@/components/Input';
import { useClients } from '@/features/clients/api';
import { oneOf, useUrlFilters } from '@/lib/useUrlFilters';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_OPTIONS } from './constants';
import { useMoneyDrawerLinks } from './MoneyDrawerHost';
import { ExpensesTable } from './tables/ExpensesTable';
import type { Expense, ExpenseCategory } from './types';

const FILTER_KEYS = ['category', 'repeats'] as const;
const CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];
const REPEAT_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'once', label: 'Once-off' },
] as const;

export function ExpensesPanel({ expenses }: { expenses: Expense[] }) {
  const { data: clients = [] } = useClients();
  const { openExpense, openNewExpense } = useMoneyDrawerLinks();
  const { values, setFilter, clearFilters, activeCount } = useUrlFilters(FILTER_KEYS);

  const clientNames = new Map(clients.map((client) => [client.id, client.business_name]));
  const category = oneOf(values.category, CATEGORIES);
  const repeats = oneOf(values.repeats, ['monthly', 'once'] as const);
  const rows = expenses.filter(
    (expense) =>
      (!category || expense.category === category) &&
      (!repeats || expense.recurring === (repeats === 'monthly')),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Filter by category"
          placeholder="All categories"
          options={EXPENSE_CATEGORY_OPTIONS}
          value={category}
          onChange={(event) => setFilter('category', event.target.value)}
          className="w-[calc(50%-4px)] sm:w-44"
        />
        <Select
          aria-label="Filter by repeats"
          placeholder="Monthly and once-off"
          options={REPEAT_OPTIONS}
          value={repeats}
          onChange={(event) => setFilter('repeats', event.target.value)}
          className="w-[calc(50%-4px)] sm:w-52"
        />
        {activeCount > 0 && (
          <Button variant="ghost" icon={FilterX} onClick={clearFilters}>
            Clear
          </Button>
        )}
        <Button icon={Plus} onClick={openNewExpense} className="sm:ml-auto">
          Add expense
        </Button>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Add your hosting, API and software costs. Monthly subscriptions only need adding once."
          action={
            <Button variant="primary" icon={Plus} onClick={openNewExpense}>
              Add expense
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState icon={FilterX} title="No expenses match these filters" action={<Button onClick={clearFilters}>Clear filters</Button>} />
      ) : (
        <ExpensesTable expenses={rows} clientNames={clientNames} onOpen={openExpense} />
      )}
    </div>
  );
}
