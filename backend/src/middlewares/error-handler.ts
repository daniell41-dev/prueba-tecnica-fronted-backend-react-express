import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { zodErrorToFieldErrors } from '../utils/zod-errors.js';

/** Código de Postgres para violación de una restricción `UNIQUE`. */
const PG_UNIQUE_VIOLATION = '23505';

function isJsonParseError(error: unknown): boolean {
  return error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed';
}

function isPgUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === PG_UNIQUE_VIOLATION;
}

function serverErrorPayload(error: unknown): Record<string, unknown> {
  if (!env.APP_DEBUG) {
    return { message: 'Ocurrió un error inesperado.' };
  }
  const message = error instanceof Error ? error.message : 'Error desconocido.';
  const name = error instanceof Error ? error.constructor.name : 'UnknownError';
  return { message, error: name };
}

/**
 * Punto único de traducción de excepciones a respuesta HTTP — el
 * equivalente Node de `Kernel::handle()` en la versión PHP. Es un middleware
 * de **4 argumentos**: esa firma es lo que le dice a Express "esto es un
 * error handler", sin importar el nombre de la función ni dónde se declare
 * — solo importa que se registre **al final**, después de las rutas (ver
 * `docs/03-fundamentos-node-express.md`).
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(422).json({ message: 'Los datos enviados no son válidos.', errors: zodErrorToFieldErrors(err) });
    return;
  }

  if (isJsonParseError(err)) {
    res.status(400).json({ message: 'El cuerpo de la solicitud no es JSON válido.' });
    return;
  }

  if (isPgUniqueViolation(err)) {
    res.status(409).json({ message: 'El correo ya está registrado.' });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json(serverErrorPayload(err));
};
