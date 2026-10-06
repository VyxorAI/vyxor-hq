import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Input, Textarea } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/errors';
import { addDaysISO, todayISO } from '@/lib/format';
import { useConvertProspect } from '../api';
import { CHANNELS } from '../constants';
import type { ContactChannel, Prospect } from '../types';

interface ContactedModalProps {
  prospect: Prospect | null;
  onClose: () => void;
}

/** Record the first contact and move the business to Leads (stage: Contacted). */
export function ContactedModal({ prospect, onClose }: ContactedModalProps) {
  return (
    <Modal
      open={prospect !== null}
      onClose={onClose}
      title={prospect ? `Move ${prospect.business_name} to Leads` : 'Move to Leads'}
      description="It's added to the pipeline as Contacted, with the details and suggested pitch filled in."
    >
      {prospect && <ContactedForm key={prospect.id} prospect={prospect} onClose={onClose} />}
    </Modal>
  );
}

function ContactedForm({ prospect, onClose }: { prospect: Prospect; onClose: () => void }) {
  const toast = useToast();
  const convert = useConvertProspect();
  const [channel, setChannel] = useState<ContactChannel>('call');
  const [note, setNote] = useState('');
  const [followUp, setFollowUp] = useState(addDaysISO(todayISO(), 3));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    convert.mutate(
      { prospectId: prospect.id, channel, note: note.trim() || undefined, followUp: followUp || undefined },
      {
        onSuccess: () => {
          toast.success(`${prospect.business_name} is now a lead in Contacted.`);
          onClose();
        },
        onError: (error) => toast.error(`Couldn't move it to Leads. ${errorMessage(error)}`),
      },
    );
  }

  const selected = CHANNELS.find((option) => option.value === channel)!;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-xs font-medium text-muted">How did you contact them?</legend>
        <div role="radiogroup" className="grid gap-1.5 sm:grid-cols-3">
          {CHANNELS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={channel === option.value}
              onClick={() => setChannel(option.value)}
              className={cn(
                'rounded-control border px-2.5 py-2 text-left text-xs font-medium transition-colors',
                channel === option.value
                  ? 'border-accent-blue bg-accent-blue/10 text-primary'
                  : 'border-border text-muted hover:text-primary',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className={cn('text-xs', channel === 'call' ? 'text-muted' : 'text-warning')}>{selected.hint}</p>
      </fieldset>

      <Field label="What happened?" htmlFor="contacted-note" hint="Optional. Saved in the lead's activity.">
        <Textarea
          id="contacted-note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Spoke to the practice manager, asked us to send pricing"
          data-autofocus
        />
      </Field>

      <Field label="Follow up on" htmlFor="contacted-follow-up">
        <Input id="contacted-follow-up" type="date" value={followUp} onChange={(event) => setFollowUp(event.target.value)} />
      </Field>

      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" loading={convert.isPending}>
          Move to Leads
        </Button>
      </div>
    </form>
  );
}
