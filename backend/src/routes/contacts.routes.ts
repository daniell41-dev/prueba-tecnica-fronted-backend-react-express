import { Router } from 'express';
import type { ContactsController } from '../controllers/contacts.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';
import { validateBody } from '../middlewares/validate-body.js';
import { createContactSchema, patchContactSchema, replaceContactSchema } from '../schemas/contact.schema.js';
import { importContactsSchema } from '../schemas/import-contacts.schema.js';

/**
 * Mapa ruta → controller — equivalente de `routes/api.php`. Las lecturas son
 * públicas; las escrituras exigen `requireAuth`. Se registra montado bajo
 * `/contacts` desde `routes/index.ts`.
 */
export function contactsRoutes(controller: ContactsController): Router {
  const router = Router();

  router.get('/stats', controller.stats);
  router.get('/', controller.index);
  router.get('/:id', controller.show);

  router.post('/', requireAuth, validateBody(createContactSchema), controller.store);
  router.post('/import', requireAuth, validateBody(importContactsSchema), controller.import);
  router.put('/:id', requireAuth, validateBody(replaceContactSchema), controller.replace);
  router.patch('/:id', requireAuth, validateBody(patchContactSchema), controller.patch);
  router.delete('/:id', requireAuth, controller.destroy);

  return router;
}
