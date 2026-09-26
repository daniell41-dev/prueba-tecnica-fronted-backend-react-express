import { Router } from 'express';
import type { AppDependencies } from '../container.js';
import { authRoutes } from './auth.routes.js';
import { contactsRoutes } from './contacts.routes.js';

/** Todo lo demás cuelga de `/api` — lo monta `app.ts`. */
export function apiRoutes(deps: AppDependencies): Router {
  const router = Router();

  router.get('/health', deps.healthController.check);
  router.use('/auth', authRoutes(deps.authController));
  router.use('/contacts', contactsRoutes(deps.contactsController));

  return router;
}
