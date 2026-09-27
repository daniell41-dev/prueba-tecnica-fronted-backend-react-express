import { defineConfig } from 'vitest/config';

/**
 * Tests de integración: requieren Postgres real (ver `docs/07-docker-desktop.md`
 * y `pnpm db:up`). Corren en serie (`fileParallelism: false`) porque comparten
 * la misma base `contacts_test` y cada test la deja limpia truncando tablas,
 * no aislando conexiones.
 */
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    globals: false,
    fileParallelism: false,
    hookTimeout: 20_000,
    testTimeout: 10_000,
    // Misma base que usa `docker-compose.yml` para el servicio `db`, pero
    // contra la base `contacts_test` (la crea el init script de Postgres).
    // Si corres Postgres fuera de Docker, exporta DATABASE_URL antes de este
    // comando y se usa esa en su lugar.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://contacts:contacts@localhost:5432/contacts_test',
      JWT_SECRET: 'test-only-secret-nunca-usar-en-produccion-32+',
      APP_DEBUG: 'true',
    },
  },
});
