import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';

/**
 * Valida y reemplaza `req.body` con la versión ya parseada/normalizada por
 * el schema (trim, `toLowerCase()` del email, teléfonos normalizados...).
 * Si `schema.parse` lanza `ZodError`, Express la reenvía sola a
 * `errorHandler` — no hace falta un `try/catch` aquí: incluso un middleware
 * síncrono que lanza dispara automáticamente `next(err)`.
 */
export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}
