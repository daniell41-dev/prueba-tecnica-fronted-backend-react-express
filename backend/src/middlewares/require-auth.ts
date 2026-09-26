import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';

interface AccessTokenPayload {
  sub: string;
  email: string;
}

function isAccessTokenPayload(value: unknown): value is AccessTokenPayload {
  return typeof value === 'object' && value !== null && 'sub' in value && 'email' in value;
}

/**
 * Protege una ruta exigiendo `Authorization: Bearer <token>`. Usa
 * `jwt.verify` (nunca `jwt.decode`, que no comprueba la firma ni la
 * expiración) y deja al usuario en `req.user` para que el controller lo lea.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Falta el token de autenticación.'));
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (!isAccessTokenPayload(payload)) {
      throw new Error('Payload de token con forma inesperada.');
    }
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new UnauthorizedError('Token inválido o expirado.'));
  }
}
