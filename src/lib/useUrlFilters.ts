import { useUpdateParams } from './useUpdateParams';

/** A URL value, only if it is one of the allowed options. */
export function oneOf<T extends string>(value: string | null | undefined, allowed: readonly T[]): T | '' {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : '';
}

/**
 * Table filters kept in the URL, so links and the top bar search can set them.
 * Returns the raw values; callers narrow them with `oneOf`.
 */
export function useUrlFilters<K extends string>(keys: readonly K[]) {
  const [params, update] = useUpdateParams();

  const values = Object.fromEntries(keys.map((key) => [key, params.get(key) ?? ''])) as Record<K, string>;

  function setFilter(key: K, value: string) {
    update((next) => (value ? next.set(key, value) : next.delete(key)), true);
  }

  function clearFilters() {
    update((next) => keys.forEach((key) => next.delete(key)), true);
  }

  const activeCount = keys.filter((key) => values[key]).length;

  return { values, setFilter, clearFilters, activeCount };
}
