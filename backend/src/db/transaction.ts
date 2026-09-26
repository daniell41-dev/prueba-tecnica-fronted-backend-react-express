import type { Pool, PoolClient } from 'pg';

/**
 * `BEGIN` → `fn(client)` → `COMMIT`, con `ROLLBACK` automático si `fn` lanza.
 * El `client` se libera siempre (`finally`), se haya confirmado o revertido.
 * Se usa para crear/reemplazar un contacto junto con sus teléfonos: si falla
 * a mitad, no debe quedar un contacto sin teléfonos o con teléfonos de otro.
 */
export async function withTransaction<T>(pool: Pool, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
