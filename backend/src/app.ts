import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import type { AppDependencies } from './container.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { requestLogger } from './middlewares/request-logger.js';
import { apiRoutes } from './routes/index.js';

/**
 * Arma la app de Express a partir de `AppDependencies`, sin tocar `process.env`
 * ni abrir conexiones — eso es trabajo de `server.ts`/`container.ts`. Por eso
 * los tests pueden llamar a `createApp(deps)` con repositorios en memoria y
 * ejercitar la API completa con Supertest, sin levantar un servidor HTTP real
 * ni una base de datos.
 *
 * Orden de middlewares (importa, se ejecutan en cadena): seguridad → CORS →
 * parseo de JSON → logging → rutas de negocio → 404 → manejador de errores.
 * El manejador de errores va **al final**: Express lo reconoce por su firma
 * de 4 argumentos, no por dónde se define, pero solo atrapa errores de
 * middlewares registrados *antes* que él.
 */
export function createApp(deps: AppDependencies): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ALLOWED_ORIGIN }));
  app.use(express.json());

  if (env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  app.use('/api', apiRoutes(deps));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
