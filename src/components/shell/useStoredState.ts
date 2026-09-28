import { useEffect, useState } from 'react';

/** useState that remembers its value in localStorage (per browser). Fails quietly. */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initial : (JSON.parse(stored) as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable (private mode etc.): keep the in-memory value
    }
  }, [key, value]);

  return [value, setValue] as const;
}
