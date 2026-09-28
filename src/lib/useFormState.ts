import { useState } from 'react';

type Errors<V> = Partial<Record<keyof V, string>>;

/**
 * Form values plus validation. Errors show after the first submit attempt,
 * then update live as fields change.
 */
export function useFormState<V extends object>(initial: () => V, validate: (values: V) => Errors<V>) {
  const [values, setValues] = useState<V>(initial);
  const [errors, setErrors] = useState<Errors<V>>({});
  const [submitted, setSubmitted] = useState(false);

  /** Update several fields in one go (calling `change` twice would drop the first). */
  function changeMany(patch: Partial<V>) {
    const next = { ...values, ...patch };
    setValues(next);
    if (submitted) setErrors(validate(next));
  }

  function change<K extends keyof V>(key: K, value: V[K]) {
    changeMany({ [key]: value } as unknown as Partial<V>);
  }

  /** Validate (with optional overrides); returns the values if valid, otherwise null. */
  function check(overrides: Partial<V> = {}): V | null {
    const next = { ...values, ...overrides };
    const nextErrors = validate(next);
    setSubmitted(true);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0 ? next : null;
  }

  return { values, errors, change, changeMany, check };
}
