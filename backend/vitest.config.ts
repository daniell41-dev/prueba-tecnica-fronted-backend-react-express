import { defineConfig } from 'vitest/config';

/**
 * Tests rápidos: unit + api, todos contra repos/clientes en memoria — nunca
 * abren una conexión real a Postgres. Los tests de integración viven en
 * `vitest.integration.config.ts`, con su propio comando (`pnpm test:integration`).
 */
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/api/**/*.test.ts'],
    environment: 'node',
    globals: false,
    restoreMocks: true,
    // `config/env.ts` valida `process.env` al importarse (fail fast). Estos
    // tests nunca abren una conexión real, pero DATABASE_URL igual debe "parecer"
    // válida para que la validación pase — nunca se usa de verdad aquí.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://unused:unused@localhost:5432/unused',
      JWT_SECRET: 'test-only-secret-nunca-usar-en-produccion-32+',
      APP_DEBUG: 'true',
    },
  },
});
