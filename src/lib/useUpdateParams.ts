import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Search params plus an updater that edits a copy of the current params.
 * `replace` swaps the history entry instead of adding one (for filters and toggles).
 */
export function useUpdateParams() {
  const [params, setParams] = useSearchParams();

  const update = useCallback(
    (change: (next: URLSearchParams) => void, replace = false) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          change(next);
          return next;
        },
        { replace },
      );
    },
    [setParams],
  );

  return [params, update] as const;
}
