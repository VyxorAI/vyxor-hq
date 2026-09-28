import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, PenLine } from 'lucide-react';
import { FormDrawer } from '@/components/FormDrawer';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/errors';
import { useFormState } from '@/lib/useFormState';
import { useSaveAsset } from './api';
import { AssetFields } from './form/AssetFields';
import { toAssetFormValues, toAssetPayload, validateAsset } from './form/assetFormModel';
import type { AssetKind } from './types';

const FORM_ID = 'new-asset-form';

const KINDS: ReadonlyArray<{ value: AssetKind; label: string; icon: typeof PenLine }> = [
  { value: 'document', label: 'Write a document', icon: PenLine },
  { value: 'file', label: 'Upload a file', icon: FileUp },
];

/** Add a library item: a markdown document (SOPs, prompts) or an uploaded file. Opens it when saved. */
export function NewAssetDrawer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const saveAsset = useSaveAsset();
  const form = useFormState(() => toAssetFormValues(undefined, 'document'), (values) => validateAsset(values));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = form.check();
    if (!values) return;
    saveAsset.mutate(
      { payload: toAssetPayload(values), file: values.kind === 'file' ? (values.file ?? undefined) : undefined },
      {
        onSuccess: (asset) => {
          toast.success(`${asset.title} added to the library.`);
          navigate(`/library/${asset.id}`);
        },
        onError: (error) => toast.error(`Couldn't save it. ${errorMessage(error)}`),
      },
    );
  }

  return (
    <FormDrawer
      title="Add to library"
      formId={FORM_ID}
      submitLabel={form.values.kind === 'file' ? 'Upload' : 'Save document'}
      saving={saveAsset.isPending}
      onClose={onClose}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div role="radiogroup" aria-label="What are you adding?" className="grid grid-cols-2 gap-2">
          {KINDS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={form.values.kind === value}
              onClick={() =>
                form.changeMany({ kind: value, type: value === 'document' ? 'sop' : 'proposal', file: null })
              }
              className={cn(
                'flex items-center justify-center gap-2 rounded-card border px-3 py-3 text-sm font-medium transition-colors',
                form.values.kind === value
                  ? 'border-accent-blue bg-accent-blue/10 text-primary'
                  : 'border-border text-muted hover:text-primary',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <AssetFields id={FORM_ID} values={form.values} errors={form.errors} onChange={form.changeMany} />
      </form>
    </FormDrawer>
  );
}
