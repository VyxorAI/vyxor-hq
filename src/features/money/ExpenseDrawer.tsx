import { FormDrawer } from '@/components/FormDrawer';
import { useToast } from '@/components/Toast';
import { errorMessage } from '@/lib/errors';
import { useFormState } from '@/lib/useFormState';
import { useDeleteExpense, useSaveExpense } from './api';
import { ExpenseForm } from './form/ExpenseForm';
import { toExpenseFormValues, toExpensePayload, validateExpense } from './form/expenseFormModel';
import type { Expense } from './types';

const FORM_ID = 'expense-form';

interface ExpenseDrawerProps {
  /** Undefined when adding a new expense. */
  expense: Expense | undefined;
  defaultClientId?: string;
  onClose: () => void;
}

export function ExpenseDrawer({ expense, defaultClientId, onClose }: ExpenseDrawerProps) {
  const toast = useToast();
  const saveExpense = useSaveExpense();
  const deleteExpense = useDeleteExpense();
  const form = useFormState(() => toExpenseFormValues(expense, { clientId: defaultClientId }), validateExpense);

  function save() {
    const values = form.check();
    if (!values) return;
    saveExpense.mutate(
      { id: expense?.id, payload: toExpensePayload(values) },
      {
        onSuccess: () => {
          toast.success(expense ? 'Changes saved.' : 'Expense added.');
          onClose();
        },
        onError: (error) => toast.error(`Couldn't save the expense. ${errorMessage(error)}`),
      },
    );
  }

  return (
    <FormDrawer
      title={expense ? expense.description : 'New expense'}
      formId={FORM_ID}
      submitLabel={expense ? 'Save changes' : 'Add expense'}
      saving={saveExpense.isPending}
      onClose={onClose}
      onDelete={
        expense && {
          noun: 'expense',
          description: expense.recurring
            ? `This removes ${expense.description} from every month, including past ones. To stop it from now on, set an end date instead.`
            : `This permanently removes ${expense.description}. It can't be undone.`,
          pending: deleteExpense.isPending,
          onConfirm: () =>
            deleteExpense.mutate(expense.id, {
              onSuccess: () => {
                toast.success('Expense deleted.');
                onClose();
              },
              onError: (error) => toast.error(`Couldn't delete the expense. ${errorMessage(error)}`),
            }),
        }
      }
    >
      <ExpenseForm id={FORM_ID} values={form.values} errors={form.errors} onChange={form.change} onSubmit={save} />
    </FormDrawer>
  );
}
