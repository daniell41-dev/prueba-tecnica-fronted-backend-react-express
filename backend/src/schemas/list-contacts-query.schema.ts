import { z } from 'zod';

/**
 * Query params de `GET /api/contacts`. Se parsea a mano en el controller
 * (`listContactsQuerySchema.parse(req.query)`) y no vía `validateBody`: en
 * Express 5, `req.query` es un getter calculado a partir de la URL y no se
 * puede reasignar como `req.body` — ver `docs/03-fundamentos-node-express.md`.
 */
export const listContactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : undefined)),
  favorite: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  sort: z.enum(['first_name', 'last_name', 'created_at']).default('first_name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;
