import { Router } from 'express';
import type { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';
import { validateBody } from '../middlewares/validate-body.js';
import { loginSchema } from '../schemas/auth.schema.js';

export function authRoutes(controller: AuthController): Router {
  const router = Router();

  router.post('/login', validateBody(loginSchema), controller.login);
  router.get('/me', requireAuth, controller.me);

  return router;
}
