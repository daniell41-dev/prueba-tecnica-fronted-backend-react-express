import type { NextFunction, Request, Response } from 'express';

/**
 * Logger propio y minimalista (una línea por request) en vez de `morgan`/
 * `pino`: para este proyecto de práctica, una dependencia menos que aprender
 * vale más que el formato de log más pulido. `docs/03-fundamentos-node-express.md`
 * explica cómo se engancharía uno real.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
  });

  next();
}
