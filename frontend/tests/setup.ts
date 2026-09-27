import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

/**
 * `globals: false` en `vitest.config.ts` significa que `afterEach` no vive
 * en `globalThis` — por eso el auto-cleanup de Testing Library (que depende
 * de encontrarlo ahí) nunca se dispara solo. Sin este `afterEach` explícito,
 * cada test de un componente deja el anterior montado en el DOM.
 */
afterEach(() => {
  cleanup();
});
