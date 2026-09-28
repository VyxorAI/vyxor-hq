export type SortDirection = 'asc' | 'desc';

export interface SortState<K extends string> {
  key: K;
  direction: SortDirection;
}

export type SortValue = string | number | null | undefined;

/** Sort a copy. Empty values always go last; ties fall back to `tieBreak`. */
export function sortBy<T>(
  items: readonly T[],
  direction: SortDirection,
  value: (item: T) => SortValue,
  tieBreak: (a: T, b: T) => number,
): T[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const left = value(a) ?? null;
    const right = value(b) ?? null;
    if (left === right) return tieBreak(a, b);
    if (left === null) return 1;
    if (right === null) return -1;
    const result =
      typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right));
    return result * factor;
  });
}

/** Clicking a header: flip direction on the same column, otherwise start fresh. */
export function toggleSort<K extends string>(
  current: SortState<K>,
  key: K,
  descendingFirst: readonly K[] = [],
): SortState<K> {
  if (current.key === key) return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  return { key, direction: descendingFirst.includes(key) ? 'desc' : 'asc' };
}
