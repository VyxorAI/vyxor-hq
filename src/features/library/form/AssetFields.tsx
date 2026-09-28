import { Field } from '@/components/Field';
import { Input, Select } from '@/components/Input';
import { useAssets } from '../api';
import { FileDropzone } from '../components/FileDropzone';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { TagInput } from '../components/TagInput';
import { ASSET_TYPE_OPTIONS } from '../constants';
import { titleFromFileName, type AssetFormErrors, type AssetFormValues } from './assetFormModel';

interface AssetFieldsProps {
  id: string;
  values: AssetFormValues;
  errors: AssetFormErrors;
  onChange: (patch: Partial<AssetFormValues>) => void;
  /** Current stored file name when editing a file item. */
  currentFileName?: string | null;
  /** Side-by-side markdown preview (detail page). */
  splitEditor?: boolean;
}

/** Title, type, tags, and either the markdown editor or the file picker. */
export function AssetFields({ id, values, errors, onChange, currentFileName, splitEditor = false }: AssetFieldsProps) {
  const { data: assets = [] } = useAssets();
  const knownTags = [...new Set(assets.flatMap((asset) => asset.tags))].sort();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <Field label="Title" htmlFor={`${id}-title`} error={errors.title} required>
          <Input
            id={`${id}-title`}
            value={values.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder={values.kind === 'document' ? 'e.g. Client onboarding SOP' : 'e.g. Dental proposal template'}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? `${id}-title-error` : undefined}
            data-autofocus
          />
        </Field>
        <Field label="Type" htmlFor={`${id}-type`}>
          <Select
            id={`${id}-type`}
            options={ASSET_TYPE_OPTIONS}
            value={values.type}
            onChange={(event) => onChange({ type: event.target.value as AssetFormValues['type'] })}
          />
        </Field>
      </div>

      <Field label="Tags" htmlFor={`${id}-tags`} hint="Press Enter or comma after each tag.">
        <TagInput id={`${id}-tags`} value={values.tags} onChange={(tags) => onChange({ tags })} suggestions={knownTags} />
      </Field>

      {values.kind === 'document' ? (
        <Field label="Content" htmlFor={`${id}-content`} error={errors.content} required>
          <MarkdownEditor
            id={`${id}-content`}
            value={values.content}
            onChange={(content) => onChange({ content })}
            split={splitEditor}
            rows={splitEditor ? 24 : 14}
            invalid={Boolean(errors.content)}
          />
        </Field>
      ) : (
        <Field label={currentFileName ? 'Replace file' : 'File'} htmlFor={`${id}-file`} required={!currentFileName}>
          <FileDropzone
            id={`${id}-file`}
            file={values.file}
            currentName={currentFileName}
            error={errors.file}
            onChange={(file) =>
              // Suggest a title from the file name if none was typed yet
              onChange(file && !values.title.trim() ? { file, title: titleFromFileName(file.name) } : { file })
            }
          />
        </Field>
      )}
    </div>
  );
}
