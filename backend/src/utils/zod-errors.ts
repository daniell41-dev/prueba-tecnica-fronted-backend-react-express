import type { ZodError } from 'zod';

/**
 * Convierte un `ZodError` al mismo formato de `errors` que usa la API PHP de
 * ATL: un objeto `{ "campo.índice.subcampo": ["mensaje", ...] }`. Como Zod ya
 * reporta la ruta del issue como un arreglo (`['phones', 0, 'number']`), solo
 * hay que unirla con puntos — el resultado es idéntico al de
 * `ContactValidator::validate()` en PHP.
 */
export function zodErrorToFieldErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.map(String).join('.') : '_root';
    errors[field] = [...(errors[field] ?? []), issue.message];
  }

  return errors;
}
