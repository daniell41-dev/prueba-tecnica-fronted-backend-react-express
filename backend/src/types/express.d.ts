import 'express';
import type { AuthenticatedUser } from '../domain/user.js';

/**
 * Amplía `Request` con el usuario autenticado. `requireAuth` lo rellena tras
 * verificar el JWT; los controllers protegidos lo leen como `req.user`.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
