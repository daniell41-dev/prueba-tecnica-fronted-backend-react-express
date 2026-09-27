#!/usr/bin/env tsx
/**
 * CLI de migraciones — equivalente Node de `bin/migrate.php` en la versión
 * PHP. Aplica cada `.sql` de `db/migrations/` una sola vez (registrado en
 * `schema_migrations`), y opcionalmente recrea todo desde cero y siembra los
 * datos de ejemplo.
 *
 *   pnpm db:migrate                    # aplica las migraciones pendientes
 *   pnpm db:migrate -- --fresh         # borra las tablas y las vuelve a crear
 *   pnpm db:migrate -- --fresh --seed  # + carga los 8 contactos de ejemplo y el usuario demo
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Carga `.env` si existe (desarrollo local fuera de Docker). Dentro de
// Docker/CI las variables ya vienen del entorno y `dotenv` no las pisa.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { env } from '../src/config/env.js';
import type { PhoneType } from '../src/domain/contact.js';
import { createNewContact } from '../src/domain/contact.js';
import { PgContactRepository } from '../src/repositories/pg-contact.repository.js';
import { normalizePhone } from '../src/utils/phone.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');
const SEED_FILE = path.join(__dirname, '..', 'db', 'seeds', 'contacts.json');

const DEMO_USER_EMAIL = 'demo@example.com';
const DEMO_USER_PASSWORD = 'Demo1234!';

interface SeedPhone {
  type: string;
  number: string;
}

interface SeedContact {
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  favorite?: boolean;
  phones: SeedPhone[];
}

async function fresh(pool: Pool): Promise<void> {
  await pool.query('DROP TABLE IF EXISTS phones CASCADE');
  await pool.query('DROP TABLE IF EXISTS contacts CASCADE');
  await pool.query('DROP TABLE IF EXISTS users CASCADE');
  await pool.query('DROP TABLE IF EXISTS schema_migrations CASCADE');
  console.log('✓ tablas eliminadas (--fresh)');
}

async function applyMigrations(pool: Pool): Promise<void> {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const alreadyApplied = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
    if ((alreadyApplied.rowCount ?? 0) > 0) {
      continue;
    }

    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    console.log(`✓ migración aplicada: ${file}`);
  }
}

/**
 * `--seed` es idempotente a propósito: el contenedor `api` la corre en
 * **cada** arranque (ver `docker-compose.yml`), no solo la primera vez, así
 * que insertar un contacto cuyo email ya existe se salta en vez de reventar
 * contra la restricción única.
 */
async function seed(pool: Pool): Promise<void> {
  const repository = new PgContactRepository(pool);
  const { contacts }: { contacts: SeedContact[] } = JSON.parse(readFileSync(SEED_FILE, 'utf8'));

  for (const item of contacts) {
    if (await repository.emailExists(item.email)) {
      continue;
    }

    const contact = createNewContact({
      firstName: item.first_name,
      lastName: item.last_name,
      email: item.email,
      company: item.company,
      favorite: item.favorite ?? false,
      phones: item.phones.map((phone) => ({
        type: phone.type as PhoneType,
        number: normalizePhone(phone.number),
      })),
    });
    await repository.create(contact);
  }

  const passwordHash = await bcrypt.hash(DEMO_USER_PASSWORD, 10);
  await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING', [
    DEMO_USER_EMAIL,
    passwordHash,
  ]);

  console.log(`✓ ${contacts.length} contactos de ejemplo + usuario demo (${DEMO_USER_EMAIL} / ${DEMO_USER_PASSWORD})`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  try {
    if (args.includes('--fresh')) {
      await fresh(pool);
    }
    await applyMigrations(pool);
    if (args.includes('--seed')) {
      await seed(pool);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('✗ falló la migración:', error);
  process.exitCode = 1;
});
