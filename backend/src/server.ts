import { createApp } from './app.js';
import { env } from './config/env.js';
import { createContainer } from './container.js';
import { createPool } from './db/pool.js';

const pool = createPool();
const app = createApp(createContainer(pool));

const server = app.listen(env.PORT, () => {
  console.log(`API escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

/**
 * Graceful shutdown: al recibir SIGTERM/SIGINT (`docker compose down`,
 * `Ctrl+C`, o Docker deteniendo el contenedor), deja de aceptar conexiones
 * nuevas, espera a que terminen las requests en curso y solo entonces cierra
 * el pool de Postgres — así ninguna query queda a medias.
 */
function shutdown(signal: string): void {
  console.log(`\n${signal} recibido, cerrando...`);
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
