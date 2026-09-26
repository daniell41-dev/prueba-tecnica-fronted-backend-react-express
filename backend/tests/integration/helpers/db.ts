import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { env } from '../../../src/config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '..', '..', '..', 'db', 'migrations');

/** Un pool contra `contacts_test` (ver `vitest.integration.config.ts`). */
export function createTestPool(): Pool {
  return new Pool({ connectionString: env.DATABASE_URL });
}

/** Aplica los `.sql` de `db/migrations/` directo (sin pasar por `schema_migrations`: los tests siempre corren contra un esquema limpio). */
export async function applyMigrations(pool: Pool): Promise<void> {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    await pool.query(readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
  }
}

/** Deja la base limpia entre tests, sin tener que recrear el esquema en cada uno. */
export async function truncateAll(pool: Pool): Promise<void> {
  await pool.query('TRUNCATE TABLE phones, contacts, users RESTART IDENTITY CASCADE');
}
