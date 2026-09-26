import type { Request, Response } from 'express';

/**
 * Cualquier cosa que sepa "confirmar que la base está viva" — así el
 * controller no depende de `pg`/`Pool` directamente y los tests de API
 * pueden pasar un `healthCheck` en memoria (ver `container.ts`).
 */
export interface HealthCheck {
  ping(): Promise<void>;
}

/**
 * `GET /api/health` — lo usa el `HEALTHCHECK` del Dockerfile y Docker Compose
 * para saber cuándo el contenedor `api` está realmente listo (no solo
 * "el proceso arrancó", sino "puede hablar con la base").
 */
export class HealthController {
  constructor(private readonly healthCheck: HealthCheck) {}

  check = async (_req: Request, res: Response): Promise<void> => {
    try {
      await this.healthCheck.ping();
      res.json({ status: 'ok', db: 'up' });
    } catch {
      res.status(503).json({ status: 'error', db: 'down' });
    }
  };
}
