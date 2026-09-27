import { z } from 'zod';

export const importContactsSchema = z.object({
  count: z.number().int().min(1, 'Debe importar al menos 1 contacto.').max(20, 'No se permiten más de 20 por importación.'),
});

export type ImportContactsBody = z.infer<typeof importContactsSchema>;
