import { useState, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, IconButton } from './Button';
import { Drawer } from './Drawer';
import { Modal } from './Modal';

interface DeleteOptions {
  /** e.g. "invoice" -> "Delete invoice", "Keep invoice". */
  noun: string;
  description: string;
  pending: boolean;
  onConfirm: () => void;
}

interface FormDrawerProps {
  title: string;
  subtitle?: ReactNode;
  /** The id of the <form> inside, so the footer button can submit it. */
  formId: string;
  submitLabel: string;
  saving: boolean;
  onClose: () => void;
  /** Omit for new records. */
  onDelete?: DeleteOptions;
  children: ReactNode;
}

/** Drawer with a form, Cancel / Save in the footer and an optional confirmed delete. */
export function FormDrawer({ title, subtitle, formId, submitLabel, saving, onClose, onDelete, children }: FormDrawerProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        title={title}
        subtitle={subtitle}
        footer={
          <>
            {onDelete && (
              <IconButton
                icon={Trash2}
                label={`Delete ${onDelete.noun}`}
                onClick={() => setConfirmDelete(true)}
                className="hover:bg-danger/15 hover:text-danger"
              />
            )}
            <div className="ml-auto flex gap-2">
              <Button onClick={onClose}>Cancel</Button>
              <Button type="submit" form={formId} variant="primary" loading={saving}>
                {submitLabel}
              </Button>
            </div>
          </>
        }
      >
        {children}
      </Drawer>

      {onDelete && (
        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={`Delete this ${onDelete.noun}?`}
          description={onDelete.description}
          footer={
            <>
              <Button onClick={() => setConfirmDelete(false)}>Keep {onDelete.noun}</Button>
              <Button variant="danger" icon={Trash2} loading={onDelete.pending} onClick={onDelete.onConfirm}>
                Delete {onDelete.noun}
              </Button>
            </>
          }
        />
      )}
    </>
  );
}
