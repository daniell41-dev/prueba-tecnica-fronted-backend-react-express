import { z } from 'zod';
import { isWellFormedPhone, normalizePhone, PHONE_DIGITS } from '../utils/phone.js';

/**
 * Reglas de validación del dominio "contacto" — port 1:1 de
 * `ContactValidator::validate()` (PHP) a Zod. Mismo criterio: nombre con
 * letras/acentos, email con formato válido, teléfono a 10 dígitos sin
 * duplicados dentro del mismo contacto. La unicidad del email SÍ depende de
 * la base de datos, así que no vive aquí — la revisa `ContactsService` contra
 * el repositorio (ver `docs/11-decisiones-tecnicas.md`: por qué eso es `409`
 * y no `422`).
 */
const NAME_PATTERN = /^[\p{L}\s'-]+$/u;

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Este campo es obligatorio.')
  .max(60, 'No puede tener más de 60 caracteres.')
  .regex(NAME_PATTERN, 'Solo se permiten letras, espacios, apóstrofos y guiones.');

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Este campo es obligatorio.')
  .toLowerCase()
  .email('Debe ser un correo electrónico válido.');

/**
 * `company` como texto: máx. 80, y `""` se trata como "sin empresa". Se
 * queda a propósito **sin** transformar `undefined` — eso lo decide cada
 * schema (crear vs. actualizar parcial) de forma distinta, ver más abajo.
 */
const companyTextSchema = z.string().trim().max(80, 'No puede tener más de 80 caracteres.').nullable();

export const phoneTypeSchema = z.enum(['mobile', 'home', 'work', 'other']);

const phoneNumberSchema = z
  .string()
  .trim()
  .min(1, 'Este campo es obligatorio.')
  // Antes de normalizar: si se dejara pasar cualquier carácter, `normalizePhone`
  // borraría las letras junto con los separadores y un número con basura
  // acabaría guardándose como si fuera válido (ver utils/phone.ts).
  .refine(isWellFormedPhone, 'Solo se permiten dígitos, espacios, guiones, puntos, paréntesis y un "+" inicial.')
  .transform(normalizePhone)
  .refine((value) => value.length === PHONE_DIGITS, `Debe tener ${PHONE_DIGITS} dígitos.`);

const phoneInputSchema = z.object({
  type: phoneTypeSchema.default('mobile'),
  number: phoneNumberSchema,
});

function rejectDuplicatePhones(phones: Array<{ number: string }>, ctx: z.RefinementCtx): void {
  const indicesByNumber = new Map<string, number[]>();

  phones.forEach((phone, index) => {
    const indices = indicesByNumber.get(phone.number) ?? [];
    indices.push(index);
    indicesByNumber.set(phone.number, indices);
  });

  for (const indices of indicesByNumber.values()) {
    if (indices.length <= 1) {
      continue;
    }
    for (const index of indices) {
      ctx.addIssue({
        code: 'custom',
        message: 'Este número está duplicado en el mismo contacto.',
        path: [index, 'number'],
      });
    }
  }
}

/** Sin `.default([])` a propósito — `createContactSchema` y `patchContactSchema` decidan cada uno qué hacer si se omite. */
const phonesSchema = z
  .array(phoneInputSchema)
  .max(10, 'No se permiten más de 10 teléfonos.')
  .superRefine(rejectDuplicatePhones);

export const createContactSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  company: companyTextSchema.optional().transform((value) => value ?? null),
  favorite: z.boolean().default(false),
  phones: phonesSchema.default([]),
});

/** PUT: reemplazo completo. Mismas reglas que crear. */
export const replaceContactSchema = createContactSchema;

/**
 * PATCH: actualización parcial (p. ej. solo `favorite`, para el ★ del
 * listado). **No** se deriva con `createContactSchema.partial()` a propósito:
 * en Zod, `.partial()` vuelve opcional la *entrada* de un campo, pero si ese
 * campo tiene `.default(...)`, el default de todos modos se aplica cuando el
 * campo se omite — así que `patchContactSchema.partial().parse({})` seguiría
 * devolviendo `{ favorite: false, phones: [] }` en vez de `{}`, y un PATCH
 * que solo mandara `{ favorite: true }` borraría los teléfonos del contacto.
 * Por eso cada campo se declara aquí de cero, sin ningún `.default()`.
 */
export const patchContactSchema = z.object({
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  email: emailSchema.optional(),
  company: companyTextSchema.optional(),
  favorite: z.boolean().optional(),
  phones: phonesSchema.optional(),
});

export type CreateContactBody = z.infer<typeof createContactSchema>;
export type PatchContactBody = z.infer<typeof patchContactSchema>;
