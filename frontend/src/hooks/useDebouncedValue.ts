import { useEffect, useState } from 'react';

/** Devuelve `value`, pero solo `delayMs` después de que dejó de cambiar — así `useContacts` no dispara una request por cada tecla. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}
