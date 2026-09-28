import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Textarea } from '@/components/Input';
import { Modal } from '@/components/Modal';

interface LostReasonModalProps {
  open: boolean;
  leadName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

/** Asked when a lead is dragged into "Lost". Cancelling puts the card back. */
export function LostReasonModal({ open, leadName, onConfirm, onCancel }: LostReasonModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={`Why was ${leadName || 'this lead'} lost?`}
      description="A short reason helps spot patterns later."
    >
      {/* Remounts on each open so the text starts empty */}
      {open && <LostReasonForm onConfirm={onConfirm} onCancel={onCancel} />}
    </Modal>
  );
}

function LostReasonForm({ onConfirm, onCancel }: Pick<LostReasonModalProps, 'onConfirm' | 'onCancel'>) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmed) onConfirm(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Lost reason" htmlFor="lost-reason-input" required>
        <Textarea
          id="lost-reason-input"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Went with a cheaper agency"
          data-autofocus
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Keep current stage</Button>
        <Button type="submit" variant="danger" disabled={!trimmed}>
          Mark as lost
        </Button>
      </div>
    </form>
  );
}
