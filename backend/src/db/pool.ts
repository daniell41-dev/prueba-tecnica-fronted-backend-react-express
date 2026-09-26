import { Pool } from 'pg';
import { env } from '../config/env.js';

/**
 * Un único `Pool` para toda la app: reutiliza conexiones en vez de abrir una
 * por request (lo que se paga es abrir la conexión TCP+auth, no la query).
 * `server.ts` lo cierra con `pool.end()` en el graceful shutdown.
 */
export function createPool(): Pool {
  return new Pool({ connectionString: env.DATABASE_URL });
}
